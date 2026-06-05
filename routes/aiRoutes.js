const express = require("express");
const {
  predictPrice,
  generateDescription,
  getRecommendations,
  propertyTourAssistant,
  marketAnalysis
} = require("../controllers/aiController");
const auth = require("../middleware/authmiddleware");

const router = express.Router();

// Price prediction (no auth required for demo)
router.post("/predict-price", predictPrice);

// Generate property description (requires auth)
router.post("/generate-description", auth, generateDescription);

// Generate property description standalone (no auth required for demo)
router.post("/generate-description-standalone", require("../controllers/aiController").generateStandaloneDescription);

// Get property recommendations (requires auth)
router.get("/recommendations", auth, getRecommendations);

// Virtual property tour assistant (no auth required for demo)
router.post("/tour-assistant", propertyTourAssistant);

// Market analysis (no auth required)
router.get("/market-analysis", marketAnalysis);

module.exports = router;