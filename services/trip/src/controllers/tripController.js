const Trip = require("../models/trip");
const redis = require("../cache/redis");
const rabbitmq = require("../config/rabbitmq");
const { v4: uuidv4 } = require("uuid");

// Helper function to calculate distance between two points
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper function to calculate fare
const calculateFare = (distance, duration) => {
  const baseFare = 20; // Base fare in BDT
  const perKmRate = 15; // Rate per kilometer
  const perMinuteRate = 2; // Rate per minute

  return baseFare + distance * perKmRate + duration * perMinuteRate;
};

// Create a new trip
const createTrip = async (req, res) => {
  try {
    const { userId, driverId, rideId, pickupLocation, dropoffLocation } =
      req.body;

    // Check cache first
    const cacheKey = `trip:${rideId}`;
    const cachedTrip = await redis.get(cacheKey);
    if (cachedTrip) {
      return res.status(200).json(cachedTrip);
    }

    const trip = new Trip({
      userId,
      driverId,
      rideId,
      pickupLocation,
      dropoffLocation,
      status: "pending",
    });

    await trip.save();

    // Cache the trip
    await redis.set(cacheKey, trip, 1800); // 30 minutes TTL

    // Publish trip created event
    await rabbitmq.publishEvent("trip_events", "trip.created", {
      type: "trip.created",
      tripId: trip.tripId,
      userId,
      driverId,
      rideId,
      status: trip.status,
      timestamp: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Trip created successfully",
      data: trip,
    });
  } catch (error) {
    console.error("Create trip error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create trip",
      error: error.message,
    });
  }
};

// Start a trip
const startTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    // Check cache first
    const cacheKey = `trip:${tripId}`;
    let trip = await redis.get(cacheKey);

    if (!trip) {
      trip = await Trip.findOne({ tripId });
      if (!trip) {
        return res.status(404).json({
          success: false,
          message: "Trip not found",
        });
      }
    }

    if (trip.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Trip cannot be started. Current status: " + trip.status,
      });
    }

    trip.status = "started";
    trip.startTime = new Date();
    await trip.save();

    // Update cache
    await redis.set(cacheKey, trip, 1800);

    // Publish trip started event
    await rabbitmq.publishEvent("trip_events", "trip.started", {
      type: "trip.started",
      tripId: trip.tripId,
      userId: trip.userId,
      driverId: trip.driverId,
      startTime: trip.startTime,
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Trip started successfully",
      data: trip,
    });
  } catch (error) {
    console.error("Start trip error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to start trip",
      error: error.message,
    });
  }
};

// End a trip
const endTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { endLocation } = req.body;

    // Check cache first
    const cacheKey = `trip:${tripId}`;
    let trip = await redis.get(cacheKey);

    if (!trip) {
      trip = await Trip.findOne({ tripId });
      if (!trip) {
        return res.status(404).json({
          success: false,
          message: "Trip not found",
        });
      }
    }

    if (trip.status !== "started") {
      return res.status(400).json({
        success: false,
        message: "Trip cannot be ended. Current status: " + trip.status,
      });
    }

    trip.status = "completed";
    trip.endTime = new Date();
    trip.dropoffLocation = endLocation || trip.dropoffLocation;

    // Calculate duration and distance
    const duration = Math.round((trip.endTime - trip.startTime) / (1000 * 60)); // minutes
    const distance = calculateDistance(
      trip.pickupLocation.coordinates.lat,
      trip.pickupLocation.coordinates.lng,
      trip.dropoffLocation.coordinates.lat,
      trip.dropoffLocation.coordinates.lng,
    );

    trip.duration = duration;
    trip.distance = distance;
    trip.fare = calculateFare(distance, duration);

    await trip.save();

    // Update cache
    await redis.set(cacheKey, trip, 1800);

    // Publish trip completed event
    await rabbitmq.publishEvent("trip_events", "trip.completed", {
      type: "trip.completed",
      tripId: trip.tripId,
      userId: trip.userId,
      driverId: trip.driverId,
      fare: trip.fare,
      duration: trip.duration,
      distance: trip.distance,
      endTime: trip.endTime,
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Trip completed successfully",
      data: trip,
    });
  } catch (error) {
    console.error("End trip error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to end trip",
      error: error.message,
    });
  }
};

// Get trip by ID
const getTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    // Check cache first
    const cacheKey = `trip:${tripId}`;
    let trip = await redis.get(cacheKey);

    if (!trip) {
      trip = await Trip.findOne({ tripId });
      if (!trip) {
        return res.status(404).json({
          success: false,
          message: "Trip not found",
        });
      }
      // Cache the trip
      await redis.set(cacheKey, trip, 1800);
    }

    res.status(200).json({
      success: true,
      data: trip,
    });
  } catch (error) {
    console.error("Get trip error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get trip",
      error: error.message,
    });
  }
};

// Get trips by user ID
const getUserTrips = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const trips = await Trip.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Trip.countDocuments(query);

    res.status(200).json({
      success: true,
      data: trips,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalTrips: count,
      },
    });
  } catch (error) {
    console.error("Get user trips error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user trips",
      error: error.message,
    });
  }
};

// Rate a trip
const rateTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { rating, review } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const trip = await Trip.findOne({ tripId });
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    if (trip.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Can only rate completed trips",
      });
    }

    trip.rating = rating;
    trip.review = review;
    await trip.save();

    // Clear cache
    await redis.del(`trip:${tripId}`);

    // Publish trip rated event
    await rabbitmq.publishEvent("trip_events", "trip.rated", {
      type: "trip.rated",
      tripId: trip.tripId,
      userId: trip.userId,
      driverId: trip.driverId,
      rating,
      review,
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Trip rated successfully",
      data: trip,
    });
  } catch (error) {
    console.error("Rate trip error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to rate trip",
      error: error.message,
    });
  }
};

// Cancel a trip
const cancelTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findOne({ tripId });
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    if (trip.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Can only cancel pending trips",
      });
    }

    trip.status = "cancelled";
    await trip.save();

    // Clear cache
    await redis.del(`trip:${tripId}`);

    // Publish trip cancelled event
    await rabbitmq.publishEvent("trip_events", "trip.cancelled", {
      type: "trip.cancelled",
      tripId: trip.tripId,
      userId: trip.userId,
      driverId: trip.driverId,
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Trip cancelled successfully",
      data: trip,
    });
  } catch (error) {
    console.error("Cancel trip error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel trip",
      error: error.message,
    });
  }
};

module.exports = {
  createTrip,
  startTrip,
  endTrip,
  getTrip,
  getUserTrips,
  rateTrip,
  cancelTrip,
};
