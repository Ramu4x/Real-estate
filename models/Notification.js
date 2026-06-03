const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["message", "tour_request", "tour_confirmed", "tour_cancelled", "property_inquiry", "favorite", "call", "system"],
      default: "system",
    },
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
    title: { type: String, required: true },
    message: { type: String },
    read: { type: Boolean, default: false },
    actionUrl: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
