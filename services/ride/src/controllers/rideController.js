const Ride = require("../models/ride");
const rabbitmq = require("../config/rabbitmq");

// Create a new ride
exports.createRide = async (req, res) => {
  try {
    const { origin, destination } = req.body;
    const userId = req.user.id;
    const ride = new Ride({ userId, origin, destination });
    await ride.save();

    await rabbitmq.publishEvent("ride_events", "ride.created", {
      type: "ride.created",
      rideId: ride.rideId,
      userId: ride.userId,
      status: ride.status,
      origin: ride.origin,
      destination: ride.destination,
      timestamp: new Date(),
    });

    res.status(201).json(ride);
  } catch (err) {
    res.status(500).json({ error: "Failed to create ride" });
  }
};

// Get all rides for a user
exports.getUserRides = async (req, res) => {
  try {
    const userId = req.user.id;
    const rides = await Ride.find({ userId }).sort({ createdAt: -1 });
    res.json(rides);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch rides" });
  }
};

// Get a ride by ID
exports.getRideById = async (req, res) => {
  try {
    const ride = await Ride.findOne({ rideId: req.params.rideId });
    if (!ride) return res.status(404).json({ error: "Ride not found" });
    res.json(ride);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ride" });
  }
};

// Accept a ride (mock driver acceptance)
exports.acceptRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { driverId } = req.body;

    if (!driverId) {
      return res.status(400).json({ error: "driverId is required" });
    }

    const ride = await Ride.findOne({ rideId });
    if (!ride) return res.status(404).json({ error: "Ride not found" });

    if (ride.status !== "pending") {
      return res.status(400).json({ error: "Ride cannot be accepted" });
    }

    ride.status = "accepted";
    ride.driverId = driverId;
    await ride.save();

    await rabbitmq.publishEvent("ride_events", "ride.accepted", {
      type: "ride.accepted",
      rideId: ride.rideId,
      userId: ride.userId,
      driverId: ride.driverId,
      status: ride.status,
      timestamp: new Date(),
    });

    res.json(ride);
  } catch (err) {
    res.status(500).json({ error: "Failed to accept ride" });
  }
};
