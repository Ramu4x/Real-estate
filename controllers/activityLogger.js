const ActivityLog = require("../models/ActivityLog");

// Small helper you can call from anywhere to persist user activity
async function logActivity(userId, action, details = {}) {
  try {
    await ActivityLog.create({
      user: userId || undefined,
      action,
      details,
    });
  } catch (err) {
    // Swallow errors so logging never breaks main flow
    console.error("ActivityLog error:", err.message);
  }
}

module.exports = { logActivity };

