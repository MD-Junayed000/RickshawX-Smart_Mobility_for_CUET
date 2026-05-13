const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const notificationSchema = new mongoose.Schema({
  notificationId: { type: String, unique: true },
  userId: { type: String },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: Object },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.pre("save", function (next) {
  if (!this.notificationId) {
    this.notificationId = `NOTIF_${uuidv4()}`;
  }
  next();
});

module.exports = mongoose.model("Notification", notificationSchema);
