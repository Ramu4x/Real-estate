const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { createNotification } = require("./notificationController");

const formatMessage = (msg) => ({
  id: msg._id,
  inquiryId: msg.inquiryId || msg.conversation,
  senderId: msg.sender?._id || msg.sender,
  senderName: msg.sender?.name || msg.senderName || "",
  receiverId: msg.receiver || msg.to || msg.receiverId,
  message: msg.content || msg.messageText || msg.message || "",
  timestamp: msg.createdAt ? msg.createdAt.toISOString() : null,
  isRead: Boolean(msg.isRead || msg.read),
});

const formatConversation = (convo, currentUserId) => {
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

// GET /api/inquiries/:id/messages
const getInquiryMessages = async (req, res) => {
  try {
    const inquiryId = req.params.id;
    const conversation = await Conversation.findById(inquiryId)
      .populate("participants", "name avatar email role")
      .populate("property", "title images location price");

    if (!conversation) {
      return res.status(404).json({ success: false, message: "Inquiry not found" });
    }

    const userId = req.user._id.toString();
    const isParticipant = conversation.participants.some(
      (participant) => participant._id.toString() === userId
    );
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await Message.updateMany(
      { conversation: conversation._id, receiver: userId, isRead: false },
      { isRead: true }
    );

    if (conversation.lastMessageSender && conversation.lastMessageSender.toString() !== userId) {
      conversation.unreadCount = 0;
      await conversation.save();
    }

    const messages = await Message.find({ conversation: conversation._id })
      .populate("sender", "name avatar")
      .sort({ createdAt: 1 });

    const formattedConversation = formatConversation(conversation, userId);
    return res.json({
      success: true,
      messages: messages.map(formatMessage),
      data: { conversation: formattedConversation, messages: messages.map(formatMessage) },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/inquiries/:inquiryId/messages
const postInquiryMessage = async (req, res) => {
  try {
    const inquiryId = req.params.id;
    const { message, receiverId: bodyReceiverId } = req.body;
    const senderId = req.user._id.toString();

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message text is required" });
    }

    const conversation = await Conversation.findById(inquiryId).populate(
      "participants",
      "name avatar email role"
    );
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Inquiry not found" });
    }

    const participantIds = conversation.participants.map((p) => p._id.toString());
    if (!participantIds.includes(senderId)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    let receiverId = bodyReceiverId;
    if (!receiverId) {
      receiverId = participantIds.find((id) => id !== senderId);
    }
    if (!receiverId || !participantIds.includes(receiverId)) {
      return res.status(400).json({ success: false, message: "receiverId is required and must be part of the inquiry" });
    }

    const newMessage = await Message.create({
      conversation: conversation._id,
      inquiryId: conversation._id,
      sender: senderId,
      receiver: receiverId,
      content: message,
      messageText: message,
      message,
      to: receiverId,
      propertyId: conversation.property,
      isRead: false,
      read: false,
    });

    conversation.lastMessage = message.substring(0, 200);
    conversation.lastMessageAt = new Date();
    conversation.unreadCount = (conversation.unreadCount || 0) + 1;
    conversation.lastMessageSender = senderId;
    await conversation.save();

    await createNotification({
      recipient: receiverId,
      sender: senderId,
      type: "message",
      property: conversation.property,
      title: `New reply from ${req.user.name}`,
      message: message.substring(0, 100),
      actionUrl: `/dashboard.html#messages`,
    });

    const sentMessage = await Message.findById(newMessage._id).populate("sender", "name avatar");
    const formatted = formatMessage(sentMessage);
    return res.status(201).json({
      success: true,
      message: formatted,
      data: { message: formatted },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getInquiryMessages, postInquiryMessage };
