const Property = require("../models/Property");
const Booking = require("../models/Booking");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const Notification = require("../models/Notification");
const User = require("../models/User");

// Helper: Format booking to match legacy propertyId/buyerId/sellerId fields on frontend
const formatBooking = (b) => {
  if (!b) return null;
  const bObj = b.toObject ? b.toObject() : b;
  bObj.propertyId = bObj.property;
  bObj.buyerId = bObj.buyer;
  bObj.sellerId = bObj.seller;
  return bObj;
};

// Helper: Format conversation to match legacy map unreadCount structure on frontend
const formatConversation = (convo, currentUserId) => {
  if (!convo) return null;
  const convoObj = convo.toObject ? convo.toObject() : convo;
  const unreadObj = {};
  
  if (convoObj.lastMessageSender && convoObj.lastMessageSender.toString() !== currentUserId.toString()) {
    unreadObj[currentUserId.toString()] = convoObj.unreadCount || 0;
  } else if (!convoObj.lastMessageSender && convoObj.participants) {
    const otherParticipant = convoObj.participants.find(p => {
      const pId = p._id ? p._id.toString() : p.toString();
      return pId !== currentUserId.toString();
    });
    if (otherParticipant) {
      const otherId = otherParticipant._id ? otherParticipant._id.toString() : otherParticipant.toString();
      unreadObj[otherId] = convoObj.unreadCount || 0;
    }
  }
  convoObj.unreadCount = unreadObj;
  return convoObj;
};

// GET /api/dashboard/seller
const getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.user._id;

    const [listings, bookings, conversations, unreadNotifs] = await Promise.all([
      Property.find({ createdBy: sellerId }).sort({ createdAt: -1 }),
      Booking.find({ $or: [{ seller: sellerId }, { buyer: sellerId }] })
        .populate("property", "title location images price")
        .populate("buyer", "name avatar email phone")
        .populate("seller", "name avatar email phone")
        .sort({ createdAt: -1 }),
      Conversation.find({ participants: sellerId })
        .populate("participants", "name avatar email role")
        .populate("property", "title images location price")
        .sort({ lastMessageAt: -1 }),
      Notification.countDocuments({ recipient: sellerId, read: false }),
    ]);

    const activeListings = listings.filter(p => p.status === "available");
    const pendingBookings = bookings.filter(b => b.status === "pending");
    const totalViews = listings.reduce((sum, p) => sum + (p.views || p.viewCount || 0), 0);

    // Recent messages across all conversations
    const recentMessages = await Message.find({
      conversation: { $in: conversations.map(c => c._id) },
      sender: { $ne: sellerId },
    })
      .populate("sender", "name avatar")
      .populate("conversation")
      .sort({ createdAt: -1 })
      .limit(10);

    const formattedBookings = bookings.map(formatBooking);
    const formattedPendingBookings = pendingBookings.map(formatBooking);
    const formattedConversations = conversations.map(c => formatConversation(c, sellerId));

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
        recentBookings: formattedBookings.slice(0, 5),
        pendingBookings: formattedPendingBookings.slice(0, 5),
        conversations: formattedConversations.slice(0, 10),
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
      Booking.find({ buyer: buyerId })
        .populate("property", "title location images price")
        .populate("seller", "name avatar email phone")
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

    const formattedBookings = bookings.map(formatBooking);
    const formattedConversations = conversations.map(c => formatConversation(c, buyerId));
    const pendingBookings = formattedBookings.filter(b => b.status === "pending");
    const confirmedBookings = formattedBookings.filter(b => b.status === "confirmed");

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
        bookings: formattedBookings.slice(0, 5),
        conversations: formattedConversations.slice(0, 10),
        pendingBookings: pendingBookings.slice(0, 5),
        confirmedBookings: confirmedBookings.slice(0, 5),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getSellerDashboard, getBuyerDashboard };
