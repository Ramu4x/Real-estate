const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    role: {
      type: String,
      enum: ["admin", "seller", "buyer"],
      default: "buyer"
    },
    phone: {
      type: String
    },
    avatar: {
      type: String
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    preferences: {
      location: String,
      propertyType: String,
      minPrice: Number,
      maxPrice: Number
    },
    searchHistory: [{
      query: String,
      timestamp: { type: Date, default: Date.now }
    }],
    favorites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property"
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
