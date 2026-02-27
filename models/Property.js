const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  location: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ["flat", "house", "plot", "commercial"]
  },
  bedrooms: {
    type: Number,
    min: 0
  },
  bathrooms: {
    type: Number,
    min: 0
  },
  area: {
    type: Number,
    min: 0
  },
  amenities: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ["available", "pending", "sold"],
    default: "available"
  },
  images: [{
    type: String
  }],
  // Geospatial fields temporarily disabled due to index conflicts
  // latitude: {
  //   type: Number
  // },
  // longitude: {
  //   type: Number
  // },
  // locationPoint: {
  //   type: {
  //     type: String,
  //     enum: ['Point'],
  //     required: false
  //   },
  //   coordinates: {
  //     type: [Number],
  //     index: '2dsphere',
  //     required: false
  //   }
  // },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  viewCount: {
    type: Number,
    default: 0
  },
  favoriteCount: {
    type: Number,
    default: 0
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Property", propertySchema);
