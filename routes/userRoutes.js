const express = require("express");
const {
  getProfile,
  updateProfile,
  updatePreferences,
  addSearchHistory,
  getSearchHistory,
  getMyProperties,
  getUserById
} = require("../controllers/userController");
const auth = require("../middleware/authmiddleware");

const router = express.Router();

// Profile routes
router.get("/profile", auth, getProfile);
router.put("/profile", auth, updateProfile);
router.put("/preferences", auth, updatePreferences);

// Search history routes
router.post("/search-history", auth, addSearchHistory);
router.get("/search-history", auth, getSearchHistory);

// Property routes
router.get("/properties/my", auth, getMyProperties);

// Public user routes
router.get("/:id", getUserById);

module.exports = router;