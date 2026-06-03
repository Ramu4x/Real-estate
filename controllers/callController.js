const CallLog = require("../models/CallLog");
const ActivityLog = require("../models/ActivityLog");
const { createNotification } = require("./notificationController");

// POST /api/calls/log
const logCall = async (req, res) => {
  try {
    const { receiver, property, phoneNumber, status = "initiated" } = req.body;
    const caller = req.user._id;

    if (!receiver || !property || !phoneNumber) {
      return res.status(400).json({ success: false, message: "receiver, property and phoneNumber are required" });
    }

    const call = await CallLog.create({
      caller,
      receiver,
      property,
      phoneNumber,
      status,
    });

    await ActivityLog.create({
      user: caller,
      action: "call",
      details: { receiver, property, phoneNumber, status },
    });

    // Notify the receiver about the call attempt
    await createNotification({
      recipient: receiver,
      sender: caller,
      type: "call",
      property,
      title: "New call request",
      message: `A buyer tried to call you about this property: ${phoneNumber}`,
      actionUrl: `/dashboard.html#tour-requests`,
    });

    res.status(201).json({ success: true, data: call });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { logCall };

