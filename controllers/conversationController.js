const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { createNotification } = require("./notificationController");

// POST /api/conversations — start or get existing conversation
const startConversation = async (req, res) => {
  try {
    const { recipientId, propertyId, firstMessage } = req.body;
    const senderId = req.user._id;

    if (!recipientId || !propertyId || !firstMessage) {
      return res.status(400).json({ success: false, message: "recipientId, propertyId and firstMessage required" });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] },
      property: propertyId,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, recipientId],
        property: propertyId,
        lastMessage: firstMessage,
        lastMessageAt: new Date(),
        unreadCount: { [recipientId]: 1 },
      });
    }

    // Save the first message
    await Message.create({
      conversation: conversation._id,
      sender: senderId,
      content: firstMessage,
      to: recipientId,
      propertyId,
      message: firstMessage,
    });

    conversation.lastMessage = firstMessage;
    conversation.lastMessageAt = new Date();
    const existing = conversation.unreadCount.get(recipientId.toString()) || 0;
    conversation.unreadCount.set(recipientId.toString(), existing + 1);
    await conversation.save();

    // Notify recipient
    await createNotification({
      recipient: recipientId,
      sender: senderId,
      type: "message",
      property: propertyId,
      title: `New message from ${req.user.name}`,
      message: firstMessage.substring(0, 100),
      actionUrl: `/dashboard.html#messages`,
    });

    const populated = await Conversation.findById(conversation._id)
      .populate("participants", "name avatar email")
      .populate("property", "title images location price");

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/conversations — get all my conversations
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({ participants: userId })
      .populate("participants", "name avatar email role")
      .populate("property", "title images location price")
      .sort({ lastMessageAt: -1 });

    res.json({ success: true, data: conversations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/conversations/:id — get conversation + messages
const getConversationMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversation = await Conversation.findById(req.params.id)
      .populate("participants", "name avatar email role")
      .populate("property", "title images location price");

    if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });
    if (!conversation.participants.some(p => p._id.toString() === userId.toString())) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // Mark messages as read
    await Message.updateMany({ conversation: req.params.id, sender: { $ne: userId }, read: false }, { read: true });
    conversation.unreadCount.set(userId.toString(), 0);
    await conversation.save();

    const messages = await Message.find({ conversation: req.params.id })
      .populate("sender", "name avatar")
      .sort({ createdAt: 1 });

    res.json({ success: true, conversation, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/conversations/:id/message — send a reply
const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { content } = req.body;

    if (!content) return res.status(400).json({ success: false, message: "Message content required" });

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });
    if (!conversation.participants.some(p => p.toString() === senderId.toString())) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: senderId,
      content,
      message: content,
    });

    const recipientId = conversation.participants.find(p => p.toString() !== senderId.toString());
    conversation.lastMessage = content;
    conversation.lastMessageAt = new Date();
    const existing = conversation.unreadCount.get(recipientId.toString()) || 0;
    conversation.unreadCount.set(recipientId.toString(), existing + 1);
    await conversation.save();

    await createNotification({
      recipient: recipientId,
      sender: senderId,
      type: "message",
      property: conversation.property,
      title: `New message from ${req.user.name}`,
      message: content.substring(0, 100),
      actionUrl: `/dashboard.html#messages`,
    });

    const populated = await Message.findById(message._id).populate("sender", "name avatar");
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { startConversation, getConversations, getConversationMessages, sendMessage };
