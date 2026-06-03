const express = require("express");
const protect = require("../middleware/authmiddleware");
const { getInquiryMessages, postInquiryMessage } = require("../controllers/inquiryController");

const router = express.Router();

router.get("/:id/messages", protect, getInquiryMessages);
router.post("/:id/messages", protect, postInquiryMessage);

module.exports = router;
