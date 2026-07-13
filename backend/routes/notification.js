const express = require("express");
const router = express.Router();
const Notification = require("../models/notification");
const { isLoggedIn } = require("../middleware");
const wrapAsync = require("../utils/wrapAsync");

// GET /api/notifications
router.get(
  "/",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const list = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, notifications: list });
  })
);

// PUT /api/notifications/read-all
router.put(
  "/read-all",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: "All notifications marked as read." });
  })
);

// PUT /api/notifications/:id/read
router.put(
  "/:id/read",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, error: "Notification not found" });
    }
    res.json({ success: true, notification });
  })
);

module.exports = router;
