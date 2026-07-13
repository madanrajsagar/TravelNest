const express = require("express");
const router = express.Router();
const Report = require("../models/report");
const Listing = require("../models/listing");
const User = require("../models/user");
const Notification = require("../models/notification");
const { isLoggedIn } = require("../middleware");
const wrapAsync = require("../utils/wrapAsync");

// POST /api/reports/listing/:id
// Report a listing
router.post(
  "/listing/:id",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { reason, description } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, error: "Reason is required for submitting a report." });
    }

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ success: false, error: "Listing you are trying to report does not exist." });
    }

    // Prevent user from reporting their own listing
    if (listing.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, error: "You cannot report your own listing!" });
    }

    // Check for duplicate reports
    const existingReport = await Report.findOne({
      reporter: req.user._id,
      listing: id
    });

    if (existingReport) {
      return res.status(400).json({ success: false, error: "You have already reported this listing." });
    }

    // Create Report
    const report = new Report({
      reporter: req.user._id,
      listing: id,
      reason,
      description: description || ""
    });

    await report.save();

    // Notify all admins via database notifications
    const admins = await User.find({ role: "admin" });
    const notificationPromises = admins.map((admin) => {
      const n = new Notification({
        user: admin._id,
        title: "Listing Reported",
        message: `@${req.user.username} reported listing '${listing.title}' for: ${reason}.`,
        type: "system"
      });
      return n.save();
    });
    
    const savedNotifications = await Promise.all(notificationPromises);

    // Emit socket alert for active admin screens
    const io = req.app.get("io");
    if (io) {
      io.emit("adminNotification", {
        type: "report",
        title: "New Listing Report Received",
        message: `@${req.user.username} reported '${listing.title}'`,
        reportId: report._id,
        listingId: listing._id,
        reason,
        createdAt: report.createdAt
      });
    }

    res.json({
      success: true,
      message: "Listing has been reported successfully. The administration team will review it shortly.",
      report
    });
  })
);

module.exports = router;
