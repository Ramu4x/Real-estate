const Booking = require("../models/Booking");
const Property = require("../models/Property");
const { createNotification } = require("./notificationController");

// Helper: Format booking to match legacy propertyId/buyerId/sellerId fields on frontend
const formatBooking = (b) => {
  if (!b) return null;
  const bObj = b.toObject ? b.toObject() : b;
  bObj.propertyId = bObj.property;
  bObj.buyerId = bObj.buyer;
  bObj.sellerId = bObj.seller;
  return bObj;
};

// POST /api/bookings
const createBooking = async (req, res) => {
  try {
    const { propertyId, sellerId, date, time, phone, message } = req.body;
    const buyerId = req.user._id;

    if (!propertyId || !sellerId || !date || !time || !phone) {
      return res.status(400).json({ success: false, message: "Please provide all required fields" });
    }

    const booking = await Booking.create({
      property: propertyId,
      seller: sellerId,
      buyer: buyerId,
      date,
      time,
      phone,
      message,
      status: "pending"
    });

    const property = await Property.findById(propertyId).select("title");

    await createNotification({
      recipient: sellerId,
      sender: buyerId,
      type: "tour_request",
      property: propertyId,
      title: `New tour request from ${req.user.name}`,
      message: `${req.user.name} wants to visit "${property?.title}" on ${new Date(date).toLocaleDateString()} at ${time}`,
      actionUrl: `/dashboard.html#tour-requests`,
    });

    res.status(201).json({ success: true, data: formatBooking(booking) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/bookings/my — buyer's bookings
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ buyer: req.user._id })
      .populate("property", "title location images price")
      .populate("seller", "name phone email avatar")
      .sort({ createdAt: -1 });

    const formatted = bookings.map(formatBooking);
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/bookings/received — seller's incoming bookings
const getReceivedBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ seller: req.user._id })
      .populate("property", "title location images price")
      .populate("buyer", "name phone email avatar")
      .sort({ createdAt: -1 });

    const formatted = bookings.map(formatBooking);
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/bookings/:id — single booking details
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("property", "title location images price")
      .populate("buyer", "name phone email avatar")
      .populate("seller", "name phone email avatar");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.json({ success: true, data: formatBooking(booking) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/bookings/:id/status — seller confirms/cancels/rejects
const updateBookingStatus = async (req, res) => {
  try {
    const { status, sellerNotes } = req.body;
    const booking = await Booking.findById(req.params.id)
      .populate("property", "title")
      .populate("buyer", "name email");

    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    if (booking.seller.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    booking.status = status;
    if (sellerNotes) booking.sellerNotes = sellerNotes;
    await booking.save();

    const notifType = status === "confirmed" ? "tour_confirmed" : "tour_cancelled";
    const notifTitle = status === "confirmed"
      ? `Tour confirmed by ${req.user.name}`
      : `Tour status: ${status} by ${req.user.name}`;

    let notifMsg = `Your tour for "${booking.property?.title}" on ${new Date(booking.date).toLocaleDateString()} at ${booking.time} is ${status}.`;
    if (sellerNotes) {
      notifMsg += ` Seller notes: ${sellerNotes}`;
    }

    await createNotification({
      recipient: booking.buyer._id,
      sender: req.user._id,
      type: notifType,
      property: booking.property._id,
      title: notifTitle,
      message: notifMsg,
      actionUrl: `/dashboard.html#tour-requests`,
    });

    res.json({ success: true, data: formatBooking(booking) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createBooking, getMyBookings, getReceivedBookings, getBookingById, updateBookingStatus };
