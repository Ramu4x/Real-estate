const Booking = require("../models/Booking");
const Property = require("../models/Property");
const { createNotification } = require("./notificationController");

// POST /api/bookings
const createBooking = async (req, res) => {
  try {
    const { propertyId, sellerId, date, time, phone, message } = req.body;
    const buyerId = req.user._id;

    if (!propertyId || !sellerId || !date || !time || !phone) {
      return res.status(400).json({ success: false, message: "Please provide all required fields" });
    }

    const booking = await Booking.create({ propertyId, sellerId, buyerId, date, time, phone, message, status: "pending" });

    const property = await Property.findById(propertyId).select("title");

    await createNotification({
      recipient: sellerId,
      sender: buyerId,
      type: "tour_request",
      property: propertyId,
      title: `New tour request from ${req.user.name}`,
      message: `${req.user.name} wants to visit "${property?.title}" on ${date} at ${time}`,
      actionUrl: `/dashboard.html#tours`,
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/bookings/my — buyer's bookings
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ buyerId: req.user._id })
      .populate("propertyId", "title location images price")
      .populate("sellerId", "name phone email avatar")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/bookings/received — seller's incoming bookings
const getReceivedBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ sellerId: req.user._id })
      .populate("propertyId", "title location images price")
      .populate("buyerId", "name phone email avatar")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/bookings/:id — single booking details
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("propertyId", "title location images price")
      .populate("buyerId", "name phone email avatar")
      .populate("sellerId", "name phone email avatar");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/bookings/:id/status — seller confirms/cancels
const updateBookingStatus = async (req, res) => {
  try {
    const { status, sellerNotes } = req.body;
    const booking = await Booking.findById(req.params.id).populate("propertyId", "title");

    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    if (booking.sellerId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    booking.status = status;
    if (sellerNotes) booking.sellerNotes = sellerNotes;
    await booking.save();

    const notifType = status === "confirmed" ? "tour_confirmed" : "tour_cancelled";
    const notifTitle = status === "confirmed"
      ? `Tour confirmed by ${req.user.name}`
      : `Tour cancelled by ${req.user.name}`;
    const notifMsg = status === "confirmed"
      ? `Your tour for "${booking.propertyId?.title}" on ${booking.date} at ${booking.time} is confirmed!`
      : `Your tour for "${booking.propertyId?.title}" has been cancelled. ${sellerNotes || ""}`;

    await createNotification({
      recipient: booking.buyerId,
      sender: req.user._id,
      type: notifType,
      property: booking.propertyId._id,
      title: notifTitle,
      message: notifMsg,
      actionUrl: `/dashboard.html#tours`,
    });

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createBooking, getMyBookings, getReceivedBookings, getBookingById, updateBookingStatus };
