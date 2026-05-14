const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cfg = require("./config/env");
const tripRoutes = require("./routes/tripRoutes");
const redis = require("./cache/redis");
const rabbitmq = require("./config/rabbitmq");

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" })); // Vite dev server

// Health check endpoint
app.get("/health", (_, res) => res.json({ status: "ok", service: "trip" }));

// Routes
app.use("/trip", tripRoutes);

// Event consumers
const setupEventConsumers = async () => {
  // Listen for payment events
  await rabbitmq.consumeEvents("payment_queue", async (event) => {
    console.log("Received payment event:", event);

    if (event.type === "payment.completed" && event.tripId) {
      try {
        const Trip = require("./models/trip");
        const trip = await Trip.findOne({ tripId: event.tripId });

        if (trip) {
          trip.paymentStatus = "completed";
          trip.paymentId = event.paymentId;
          await trip.save();

          // Clear cache
          await redis.del(`trip:${event.tripId}`);

          console.log(`Payment completed for trip: ${event.tripId}`);
        }
      } catch (error) {
        console.error("Error processing payment event:", error);
      }
    }
  });

  // Listen for ride events
  await rabbitmq.consumeEvents("ride_queue", async (event) => {
    console.log("Received ride event:", event);

    if (event.type === "ride.accepted" && event.rideId) {
      try {
        // Handle ride acceptance if needed
        console.log(`Ride accepted: ${event.rideId}`);
      } catch (error) {
        console.error("Error processing ride event:", error);
      }
    }
  });
};

// Initialize connections and start server
const initialize = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(cfg.mongoUrl);
    console.log("MongoDB connected for trip service");

    // Try to connect to Redis (optional)
    try {
      await redis.connect();
    } catch (error) {
      console.log("WARN: Redis connection failed, continuing without caching");
    }

    // Try to connect to RabbitMQ (optional)
    rabbitmq.connectWithRetry(setupEventConsumers);

    // Start server
    app.listen(cfg.port, () => {
      console.log(`Trip service running on http://localhost:${cfg.port}`);
      console.log("Available endpoints:");
      console.log("  - POST   /trip");
      console.log("  - PUT    /trip/:tripId/start");
      console.log("  - PUT    /trip/:tripId/end");
      console.log("  - GET    /trip/:tripId");
      console.log("  - GET    /trip/user/:userId");
      console.log("  - POST   /trip/:tripId/rate");
      console.log("  - PUT    /trip/:tripId/cancel");
      console.log("  - GET    /health");
    });
  } catch (error) {
    console.error("Initialization error:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await mongoose.connection.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  await mongoose.connection.close();
  process.exit(0);
});

// Start the application
initialize();
