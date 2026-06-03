const mongoose = require("mongoose");

// Conversation thread between two users about a property
const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now },
    unreadCount: { type: Map, of: Number, default: {} }, // { userId: count }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);
