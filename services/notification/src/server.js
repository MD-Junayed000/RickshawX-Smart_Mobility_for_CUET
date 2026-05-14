const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cfg = require("./config/env");
const rabbitmq = require("./config/rabbitmq");
const Notification = require("./models/notification");

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  }),
);

app.get("/health", (_, res) =>
  res.json({ status: "ok", service: "notification" }),
);

app.get("/notification", async (req, res) => {
  try {
    const { userId, limit = 50 } = req.query;
    const query = userId ? { userId } : {};
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

app.get("/notification/user/:userId", async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

const buildNotification = (event) => {
  switch (event.type) {
    case "ride.created":
      return {
        title: "Ride Requested",
        message: `Ride ${event.rideId} created.`,
        userId: event.userId,
      };
    case "ride.accepted":
      return {
        title: "Ride Accepted",
        message: `Ride ${event.rideId} accepted by driver ${event.driverId}.`,
        userId: event.userId,
      };
    case "trip.started":
      return {
        title: "Trip Started",
        message: `Trip ${event.tripId} has started.`,
        userId: event.userId,
      };
    case "trip.completed":
      return {
        title: "Trip Completed",
        message: `Trip ${event.tripId} completed. Fare: BDT ${event.fare}.`,
        userId: event.userId,
      };
    case "payment.completed":
      return {
        title: "Payment Completed",
        message: `Payment ${event.paymentId} confirmed for trip ${event.tripId}.`,
        userId: event.userId,
      };
    default:
      return {
        title: "System Update",
        message: event.type
          ? `Event received: ${event.type}`
          : "Event received",
        userId: event.userId,
      };
  }
};

const handleEvent = async (event) => {
  if (!event || !event.type) return;

  const summary = buildNotification(event);
  await Notification.create({
    type: event.type,
    title: summary.title,
    message: summary.message,
    userId: summary.userId,
    data: event,
  });
};

const initialize = async () => {
  try {
    await mongoose.connect(cfg.mongoUrl);
    console.log("MongoDB connected for notification service");

    rabbitmq.connectWithRetry(() =>
      rabbitmq.consumeEvents("notification_queue", handleEvent),
    );

    app.listen(cfg.port, () => {
      console.log(
        `Notification service running on http://localhost:${cfg.port}`,
      );
    });
  } catch (error) {
    console.error("Initialization error:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", async () => {
  await mongoose.connection.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  process.exit(0);
});

initialize();
