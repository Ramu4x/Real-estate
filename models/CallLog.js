const mongoose = require("mongoose");

const callLogSchema = new mongoose.Schema(
  {
    caller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
    phoneNumber: { type: String, required: true },
    status: {
      type: String,
      enum: ["initiated", "connected", "missed"],
      default: "initiated",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CallLog", callLogSchema);

