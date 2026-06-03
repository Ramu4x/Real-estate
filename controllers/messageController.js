const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { logActivity } = require("./activityLogger");

// Helper: find or create a 2‑party conversation for a property
async function ensureConversation(userA, userB, propertyId) {
  const participants = [userA, userB];
  let convo = await Conversation.findOne({
    property: propertyId,
    participants: { $all: participants, $size: 2 },
  });

  if (!convo) {
    convo = await Conversation.create({
      participants,
      property: propertyId,
      lastMessageAt: new Date(),
    });
  }
  return convo;
}

// POST /api/messages  – create message (buyer ↔ seller)
const createMessage = async (req, res) => {
  try {
    const receiver = req.body.receiver || req.body.receiverId;
    const property = req.body.property || req.body.propertyId;
    const message = req.body.message;
    const sender = req.user._id || req.user.userId;

    console.log('=== NEW MESSAGE ===');
    console.log('From (buyer):', sender);
    console.log('To (seller):', receiver);
    console.log('Property:', property);
    console.log('Message:', message);

    if (!receiver || !property || !message) {
      return res.status(400).json({ success: false, message: "receiver, property and message are required" });
    }

    const convo = await ensureConversation(sender, receiver, property);

    const newMessage = await Message.create({
      conversation: convo._id,
      inquiryId: convo._id,
      sender: sender,
      receiver: receiver,
      content: message,
      messageText: message,
      isRead: false,
      read: false,
      // legacy fields for compatibility and user snippet request
      to: receiver,
      propertyId: property,
      message: message,
    });

    convo.lastMessage = message.substring(0, 200);
    convo.lastMessageAt = new Date();
    await convo.save();

    await logActivity(sender, "message", { receiver, property, message });

    console.log('Message saved with ID:', newMessage._id);

    res.status(201).json({ success: true, message: 'Message sent', data: newMessage });
  } catch (error) {
    console.error('Message save error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/messages – get my conversations (lightweight)
const getMyConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const convos = await Conversation.find({ participants: userId })
      .populate("participants", "name avatar email role")
      .populate("property", "title images location price")
      .sort({ lastMessageAt: -1 })
      .limit(50);

    res.json({ success: true, data: convos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/messages/:userId – chat thread with specific user
const getThreadWithUser = async (req, res) => {
  try {
    const me = req.user._id;
    const other = req.params.userId;
    const { property } = req.query;

    const query = {
      participants: { $all: [me, other], $size: 2 },
    };
    if (property) query.property = property;

    const convo = await Conversation.findOne(query);
    if (!convo) {
      return res.json({ success: true, data: { conversation: null, messages: [] } });
    }

    const messages = await Message.find({ conversation: convo._id })
      .populate("sender", "name avatar")
      .sort({ createdAt: 1 });

    res.json({ success: true, data: { conversation: convo, messages } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/messages/:id/read – mark as read
const markMessageRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: "Message not found" });

    // Only non‑sender can mark as read
    if (msg.sender.toString() === userId.toString()) {
      return res.status(400).json({ success: false, message: "Sender cannot mark own message as read" });
    }

    msg.read = true;
    await msg.save();

    res.json({ success: true, data: msg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createMessage,
  getMyConversations,
  getThreadWithUser,
  markMessageRead,
};

