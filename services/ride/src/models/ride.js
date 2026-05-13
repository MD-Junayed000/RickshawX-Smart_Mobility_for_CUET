const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const rideSchema = new mongoose.Schema({
  rideId: { type: String, default: uuidv4, unique: true },
  userId: { type: String, required: true },
  driverId: { type: String },
  status: { type: String, enum: ['pending', 'accepted', 'completed', 'cancelled'], default: 'pending' },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  fare: { type: Number },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

rideSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Ride', rideSchema); 