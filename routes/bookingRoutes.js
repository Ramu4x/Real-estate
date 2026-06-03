const express = require("express");
const router = express.Router();
const { createBooking, getMyBookings, getReceivedBookings, getBookingById, updateBookingStatus } = require("../controllers/bookingController");
const protect = require("../middleware/authmiddleware");

router.post("/", protect, createBooking);
router.get("/my", protect, getMyBookings);
router.get("/received", protect, getReceivedBookings);
router.get("/:id", protect, getBookingById);
router.put("/:id/status", protect, updateBookingStatus);

module.exports = router;
