const express = require("express");
const router = express.Router();
const Booking = require("../models/booking");
const Message = require("../models/message");
const Listing = require("../models/listing");
const { isLoggedIn } = require("../middleware");
const wrapAsync = require("../utils/wrapAsync");

// GET /api/chat/conversations
router.get(
  "/conversations",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    // 1. Find all listing IDs owned by the logged-in user
    const hostListings = await Listing.find({ owner: req.user._id }).select("_id");
    const listingIds = hostListings.map(l => l._id);

    // 2. Find bookings where user is guest OR listing is owned by user
    const bookings = await Booking.find({
      $or: [
        { user: req.user._id },
        { listing: { $in: listingIds } }
      ]
    })
      .populate("listing")
      .populate("user", "username email avatar")
      .sort({ createdAt: -1 });

    const conversations = [];

    for (let b of bookings) {
      if (!b.listing) continue;

      // Populate host username
      const populatedListing = await Listing.findById(b.listing._id).populate("owner", "username email avatar");
      const host = populatedListing ? populatedListing.owner : null;

      // Find latest message in this conversation
      const latestMessage = await Message.findOne({ booking: b._id })
        .sort({ createdAt: -1 })
        .populate("sender", "username");

      conversations.push({
        bookingId: b._id,
        listing: b.listing,
        guest: b.user,
        host,
        latestMessage,
        status: b.status
      });
    }

    res.json({ success: true, conversations });
  })
);

// GET /api/chat/bookings/:bookingId/messages
router.get(
  "/bookings/:bookingId/messages",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId).populate("listing");

    if (!booking) {
      return res.status(404).json({ success: false, error: "Booking conversation not found" });
    }

    // Verify participant authorization
    const isGuest = booking.user.toString() === req.user._id.toString();
    const isHost = booking.listing.owner.toString() === req.user._id.toString();

    if (!isGuest && !isHost) {
      return res.status(403).json({ success: false, error: "Unauthorized access to this chat" });
    }

    const messages = await Message.find({ booking: bookingId })
      .populate("sender", "username email avatar")
      .sort({ createdAt: 1 });

    // Mark other user's messages as seen
    await Message.updateMany(
      { booking: bookingId, sender: { $ne: req.user._id }, seen: false },
      { seen: true }
    );

    res.json({ success: true, messages });
  })
);

// POST /api/chat/bookings/:bookingId/messages
router.post(
  "/bookings/:bookingId/messages",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const { bookingId } = req.params;
    const { text, imageUrl } = req.body;

    if (!text && !imageUrl) {
      return res.status(400).json({ success: false, error: "Message content cannot be empty" });
    }

    const booking = await Booking.findById(bookingId).populate("listing");
    if (!booking) {
      return res.status(404).json({ success: false, error: "Booking conversation not found" });
    }

    const isGuest = booking.user.toString() === req.user._id.toString();
    const isHost = booking.listing.owner.toString() === req.user._id.toString();

    if (!isGuest && !isHost) {
      return res.status(403).json({ success: false, error: "Unauthorized stay participant" });
    }

    const newMessage = new Message({
      booking: bookingId,
      sender: req.user._id,
      text: text || "",
      imageUrl: imageUrl || ""
    });

    await newMessage.save();
    await newMessage.populate("sender", "username email avatar");

    // Real-Time Socket Broadcast
    const io = req.app.get("io");
    if (io) {
      io.to(`booking_${bookingId}`).emit("newMessage", newMessage);
      console.log(`[SOCKET BROADCAST] Message emitted to room booking_${bookingId}`);
    }

    res.json({ success: true, message: newMessage });
  })
);

module.exports = router;
