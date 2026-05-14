const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cfg = require("./config/env");
const rabbitmq = require("./config/rabbitmq");
const Payment = require("./models/payment");

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  }),
);

app.get("/health", (_, res) => res.json({ status: "ok", service: "payment" }));

app.get("/payment/:paymentId", async (req, res) => {
  try {
    const payment = await Payment.findOne({ paymentId: req.params.paymentId });
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    return res.json(payment);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch payment" });
  }
});

app.get("/payment/trip/:tripId", async (req, res) => {
  try {
    const payment = await Payment.findOne({ tripId: req.params.tripId });
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    return res.json(payment);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch payment" });
  }
});

app.post("/payment", async (req, res) => {
  try {
    const { tripId, userId, amount, method = "mock" } = req.body;
    if (!tripId || !userId || amount === undefined || amount === null) {
      return res
        .status(400)
        .json({ error: "tripId, userId, and amount are required" });
    }

    const existing = await Payment.findOne({ tripId });
    if (existing) return res.status(200).json(existing);

    const payment = await Payment.create({
      tripId,
      userId,
      amount,
      status: "completed",
      method,
    });

    await rabbitmq.publishEvent("payment_events", "payment.completed", {
      type: "payment.completed",
      paymentId: payment.paymentId,
      tripId: payment.tripId,
      userId: payment.userId,
      amount: payment.amount,
      status: payment.status,
      timestamp: new Date(),
    });

    return res.status(201).json(payment);
  } catch (error) {
    return res.status(500).json({ error: "Payment processing failed" });
  }
});

const handleTripEvent = async (event) => {
  if (!event || event.type !== "trip.completed") return;

  const { tripId, userId, fare } = event;
  if (!tripId || !userId || fare === undefined || fare === null) return;

  const existing = await Payment.findOne({ tripId });
  if (existing) return;

  const payment = await Payment.create({
    tripId,
    userId,
    amount: fare,
    status: "completed",
    method: "mock",
  });

  await rabbitmq.publishEvent("payment_events", "payment.completed", {
    type: "payment.completed",
    paymentId: payment.paymentId,
    tripId: payment.tripId,
    userId: payment.userId,
    amount: payment.amount,
    status: payment.status,
    timestamp: new Date(),
  });
};

const initialize = async () => {
  try {
    await mongoose.connect(cfg.mongoUrl);
    console.log("MongoDB connected for payment service");

    rabbitmq.connectWithRetry(() =>
      rabbitmq.consumeEvents("payment_trip_queue", handleTripEvent),
    );

    app.listen(cfg.port, () => {
      console.log(`Payment service running on http://localhost:${cfg.port}`);
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
