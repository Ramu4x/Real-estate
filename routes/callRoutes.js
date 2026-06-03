const express = require("express");
const router = express.Router();
const protect = require("../middleware/authmiddleware");
const { logCall } = require("../controllers/callController");

// Log when user clicks Call button
router.post("/log", protect, logCall);

module.exports = router;

