const Notification = require("../models/Notification");

// Helper: create a notification (used internally by other controllers)
const createNotification = async ({ recipient, sender, type, property, title, message, actionUrl }) => {
  try {
    await Notification.create({ recipient, sender, type, property, title, message, actionUrl });
  } catch (err) {
    console.error("Failed to create notification:", err.message);
  }
};

// POST /api/notifications -> create notification (internal/testing use)
const apiCreateNotification = async (req, res) => {
  try {
    const { recipient, sender, type, property, title, message, actionUrl } = req.body;
    const notification = await Notification.create({
      recipient,
      sender: sender || req.user._id,
      type,
      property,
      title,
      message,
      actionUrl,
      read: false
    });
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/notifications — get my notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("sender", "name avatar")
      .populate("property", "title images")
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, read: false });

    res.json({ success: true, data: notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/notifications/:id/read — mark one as read
const markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/notifications/read-all — mark all as read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/notifications/:id
const deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification, createNotification, apiCreateNotification };
