const express = require("express");
const router = express.Router();
const protect = require("../middleware/authmiddleware");
const {
  createMessage,
  getMyConversations,
  getThreadWithUser,
  markMessageRead,
} = require("../controllers/messageController");

// POST /api/messages           – send message
router.post("/", protect, createMessage);
// GET  /api/messages           – my conversations
router.get("/", protect, getMyConversations);
// GET  /api/messages/:userId   – thread with specific user
router.get("/:userId", protect, getThreadWithUser);
// PUT  /api/messages/:id/read  – mark as read
router.put("/:id/read", protect, markMessageRead);

module.exports = router;

