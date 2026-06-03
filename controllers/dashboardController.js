const Property = require("../models/Property");
const Booking = require("../models/Booking");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const Notification = require("../models/Notification");
const User = require("../models/User");

// GET /api/dashboard/seller
const getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.user._id;

    const [listings, bookings, conversations, unreadNotifs] = await Promise.all([
      Property.find({ createdBy: sellerId }).sort({ createdAt: -1 }),
      Booking.find({ sellerId })
        .populate("propertyId", "title location images price")
        .populate("buyerId", "name avatar email phone")
        .sort({ createdAt: -1 }),
      Conversation.find({ participants: sellerId })
        .populate("participants", "name avatar email role")
        .populate("property", "title images location price")
        .sort({ lastMessageAt: -1 }),
      Notification.countDocuments({ recipient: sellerId, read: false }),
    ]);

    const activeListings = listings.filter(p => p.status === "available");
    const pendingBookings = bookings.filter(b => b.status === "pending");
    const totalViews = listings.reduce((sum, p) => sum + (p.views || 0), 0);

    // Recent messages across all conversations
    const recentMessages = await Message.find({
      conversation: { $in: conversations.map(c => c._id) },
      sender: { $ne: sellerId },
    })
      .populate("sender", "name avatar")
      .populate("conversation")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        stats: {
          totalListings: listings.length,
          activeListings: activeListings.length,
          totalViews,
          pendingInquiries: pendingBookings.length,
          unreadNotifs,
        },
        listings: listings.slice(0, 5),
        recentBookings: bookings.slice(0, 5),
        pendingBookings: pendingBookings.slice(0, 5),
        conversations: conversations.slice(0, 10),
        recentMessages: recentMessages.slice(0, 5),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/dashboard/buyer
const getBuyerDashboard = async (req, res) => {
  try {
    const buyerId = req.user._id;

    const [bookings, conversations, user, unreadNotifs] = await Promise.all([
      Booking.find({ buyerId })
        .populate("propertyId", "title location images price")
        .populate("sellerId", "name avatar email phone")
        .sort({ createdAt: -1 }),
      Conversation.find({ participants: buyerId })
        .populate("participants", "name avatar email role")
        .populate("property", "title images location price")
        .sort({ lastMessageAt: -1 }),
      User.findById(buyerId).select("favorites searchHistory"),
      Notification.countDocuments({ recipient: buyerId, read: false }),
    ]);

    // Unread messages (where I'm not sender)
    const unreadMessages = await Message.countDocuments({
      conversation: { $in: conversations.map(c => c._id) },
      sender: { $ne: buyerId },
      read: false,
    });

    res.json({
      success: true,
      data: {
        stats: {
          savedProperties: user?.favorites?.length || 0,
          messagesSent: await Message.countDocuments({ sender: buyerId }),
          tourRequests: bookings.length,
          savedSearches: user?.searchHistory?.length || 0,
          unreadNotifs,
          unreadMessages,
        },
        bookings: bookings.slice(0, 5),
        conversations: conversations.slice(0, 10),
        pendingBookings: bookings.filter(b => b.status === "pending"),
        confirmedBookings: bookings.filter(b => b.status === "confirmed"),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getSellerDashboard, getBuyerDashboard };
