const mongoose = require("mongoose");

const searchHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    location: String,
    minPrice: Number,
    maxPrice: Number,
    bedrooms: Number,
    propertyType: String,
    resultsCount: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("SearchHistory", searchHistorySchema);

