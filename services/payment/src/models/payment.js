const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, unique: true },
  tripId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "completed",
  },
  method: { type: String, default: "mock" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

paymentSchema.pre("save", function (next) {
  if (!this.paymentId) {
    this.paymentId = `PAY_${uuidv4()}`;
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Payment", paymentSchema);
