const express = require("express");
const router = express.Router();
const protect = require("../middleware/authmiddleware");
const {
  startConversation,
  getConversations,
  getConversationMessages,
  sendMessage,
} = require("../controllers/conversationController");

router.post("/", protect, startConversation);
router.get("/", protect, getConversations);
router.get("/:id", protect, getConversationMessages);
router.post("/:id/message", protect, sendMessage);

module.exports = router;
