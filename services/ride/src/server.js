const express = require("express");
const mongoose = require("mongoose");
const cfg = require("./config/env");
const rideController = require("./controllers/rideController");
const rabbitmq = require("./config/rabbitmq");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  }),
);

// JWT auth middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token" });
  const token = authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, cfg.jwtSecret);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

app.get("/health", (_, res) => res.json({ status: "ok" }));

// Ride routes (protected)
app.post("/ride", authMiddleware, rideController.createRide);
app.get("/ride/user/me", authMiddleware, rideController.getUserRides);
app.get("/ride/:rideId", authMiddleware, rideController.getRideById);
app.put("/ride/:rideId/accept", authMiddleware, rideController.acceptRide);

mongoose
  .connect(cfg.mongoUrl)
  .then(() => {
    console.log("🟢 Mongo connected");
    rabbitmq.connect().catch(() => {
      console.log(
        "⚠️ RabbitMQ connection failed, continuing without messaging",
      );
    });
    app.listen(cfg.port, () =>
      console.log(`🚀 Ride service running on http://localhost:${cfg.port}`),
    );
  })
  .catch((err) => console.error("🔴 Mongo error", err));
