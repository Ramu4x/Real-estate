const express = require("express");
const {
  getLocationSuggestions,
  getNearbyLocations,
  getGeocodedLocation,
  getPropertiesInArea,
  getLocationStats
} = require("../controllers/locationController");

const router = express.Router();

// Get location suggestions for autocomplete
router.get("/suggestions", getLocationSuggestions);

// Get nearby locations
router.get("/nearby", getNearbyLocations);

// Get geocoded coordinates for a location
router.get("/geocode", getGeocodedLocation);

// Get properties within a specific area/radius
router.get("/properties-in-area", getPropertiesInArea);

// Get location statistics
router.get("/stats", getLocationStats);

module.exports = router;