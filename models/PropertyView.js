const mongoose = require("mongoose");

const propertyViewSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
    viewer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ipAddress: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("PropertyView", propertyViewSchema);

