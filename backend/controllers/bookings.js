const Razorpay = require("razorpay");
const crypto = require("crypto");
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const Payment = require("../models/payment");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_fallbackkey",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "fallbacksecret"
});

// POST /api/bookings/order
module.exports.createOrder = async (req, res) => {
  try {
    const { amount, listingId } = req.body;
    console.log(`\n--- CREATE PAYMENT ORDER REQUEST: Amount: ₹${amount}, Listing ID: '${listingId}' ---`);
    if (!amount) {
      return res.status(400).json({ success: false, error: "Amount is required" });
    }
    if (!listingId) {
      return res.status(400).json({ success: false, error: "Listing ID is required" });
    }

    const isMockMode = process.env.PAYMENT_MODE !== "razorpay";
    let order;

    if (isMockMode) {
      console.log("Mock Payment Mode active. Generating simulated order...");
      const mockOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      order = {
        id: mockOrderId,
        amount: Math.round(amount * 100),
        currency: "INR",
        status: "created",
        isMock: true
      };
    } else {
      console.log("Razorpay Payment Mode active. Generating gateway order...");
      const options = {
        amount: Math.round(amount * 100), // Amount in paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`
      };
      
      try {
        order = await razorpay.orders.create(options);
        console.log(`Razorpay order generated successfully: '${order.id}'`);
      } catch (razorpayError) {
        console.warn("Razorpay API order creation failed, falling back to mock order: ", razorpayError.message);
        const mockOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        order = {
          id: mockOrderId,
          amount: Math.round(amount * 100),
          currency: "INR",
          status: "created",
          isMock: true
        };
      }
    }

    // Save a pending Payment log in DB
    const pendingPayment = new Payment({
      user: req.user._id,
      listing: listingId,
      orderId: order.id,
      amount,
      status: "pending"
    });
    await pendingPayment.save();
    console.log(`Saved pending payment record in DB: Order ID '${order.id}'`);

    res.json({ success: true, order });
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/bookings/verify
module.exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      listingId,
      checkIn,
      checkOut,
      totalPrice
    } = req.body;

    console.log(`\n--- VERIFY PAYMENT REQUEST: Order: '${razorpay_order_id}', Payment: '${razorpay_payment_id}' ---`);

    const isMockOrder = razorpay_order_id && razorpay_order_id.startsWith("order_mock_");

    if (isMockOrder || razorpay_signature === "mock_signature") {
      console.log("Mock payment detected. Bypassing Razorpay signature verification.");
    } else {
      // 1. Verify Payment Signature
      const secret = process.env.RAZORPAY_KEY_SECRET || "fallbacksecret";
      const shasum = crypto.createHmac("sha256", secret);
      shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const digest = shasum.digest("hex");

      if (digest !== razorpay_signature) {
        console.warn("Payment verification failed: Signature mismatch");
        return res.status(400).json({ success: false, error: "Payment verification failed. Signature mismatch." });
      }
      console.log("Payment signature verified successfully");
    }

    // 2. Prevent Double Booking (Race condition fallback)
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    
    console.log(`Double booking check for dates: ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`);
    const conflictingBooking = await Booking.findOne({
      listing: listingId,
      status: "confirmed",
      $or: [
        { checkIn: { $lt: end }, checkOut: { $gt: start } }
      ]
    });

    if (conflictingBooking) {
      console.warn("Conflict detected! Dates are already booked.");
      return res.status(400).json({
        success: false,
        error: "These dates have already been booked by another guest. Please choose different dates."
      });
    }

    // 3. Create Booking Record
    const newBooking = new Booking({
      listing: listingId,
      user: req.user._id,
      checkIn: start,
      checkOut: end,
      totalPrice,
      paymentDetails: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature || "mock_signature",
        amount: totalPrice,
        status: "captured"
      }
    });

    await newBooking.save();
    console.log(`Booking created successfully: ID '${newBooking._id}'`);

    // Fetch listing details for notification and email
    const listing = await Listing.findById(listingId);
    if (listing) {
      // 1. Create Notification for Guest
      const Notification = require("../models/notification");
      const guestNotif = new Notification({
        user: req.user._id,
        title: "Booking Confirmed! ✈️",
        message: `Your stay at ${listing.title} has been booked successfully.`,
        type: "booking_confirmed"
      });
      await guestNotif.save();

      // 2. Create Notification for Host Owner
      const hostNotif = new Notification({
        user: listing.owner,
        title: "New Nest Reservation!",
        message: `Your stay property ${listing.title} has been reserved.`,
        type: "booking_confirmed"
      });
      await hostNotif.save();

      // 3. Send confirmation email to guest
      const { sendBookingConfirmationEmail } = require("../utils/email");
      sendBookingConfirmationEmail(req.user, newBooking, listing).catch(err => console.error("Email confirm failed:", err));
    }

    // 4. Update Payment record to captured
    const payment = await Payment.findOne({ orderId: razorpay_order_id });
    if (payment) {
      payment.status = "captured";
      payment.paymentId = razorpay_payment_id;
      payment.booking = newBooking._id;
      await payment.save();
      console.log("Updated payment record in DB to captured");
    }

    res.json({ success: true, message: "Booking confirmed successfully!", booking: newBooking });
  } catch (err) {
    console.error("Payment verification and booking creation failed:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/bookings/mock-verify
module.exports.verifyMockPayment = async (req, res) => {
  try {
    const {
      orderId,
      paymentId,
      status, // "captured" or "failed" or "pending"
      listingId,
      checkIn,
      checkOut,
      totalPrice,
      method
    } = req.body;

    console.log(`\n--- VERIFY MOCK PAYMENT REQUEST: Order: '${orderId}', Status: '${status}' ---`);

    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      return res.status(404).json({ success: false, error: "Payment record not found!" });
    }

    payment.status = status;
    payment.paymentId = paymentId;
    payment.method = method || "UPI";

    if (status === "captured") {
      // 1. Prevent Double Booking
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const conflictingBooking = await Booking.findOne({
        listing: listingId,
        status: "confirmed",
        $or: [
          { checkIn: { $lt: end }, checkOut: { $gt: start } }
        ]
      });

      if (conflictingBooking) {
        payment.status = "failed";
        await payment.save();
        return res.status(400).json({
          success: false,
          error: "These dates have already been booked. Payment marked as failed."
        });
      }

      // 2. Create Booking
      const newBooking = new Booking({
        listing: listingId,
        user: req.user._id,
        checkIn: start,
        checkOut: end,
        totalPrice,
        paymentDetails: {
          orderId,
          paymentId,
          signature: "mock_signature",
          amount: totalPrice,
          status: "captured"
        }
      });
      await newBooking.save();

      // Fetch listing details for notification and email
      const listing = await Listing.findById(listingId);
      if (listing) {
        // 1. Create Notification for Guest
        const Notification = require("../models/notification");
        const guestNotif = new Notification({
          user: req.user._id,
          title: "Booking Confirmed! ✈️",
          message: `Your stay at ${listing.title} has been booked successfully.`,
          type: "booking_confirmed"
        });
        await guestNotif.save();

        // 2. Create Notification for Host Owner
        const hostNotif = new Notification({
          user: listing.owner,
          title: "New Nest Reservation!",
          message: `Your stay property ${listing.title} has been reserved.`,
          type: "booking_confirmed"
        });
        await hostNotif.save();

        // 3. Send confirmation email to guest
        const { sendBookingConfirmationEmail } = require("../utils/email");
        sendBookingConfirmationEmail(req.user, newBooking, listing).catch(err => console.error("Email confirm failed:", err));
      }

      payment.booking = newBooking._id;
      await payment.save();
      
      console.log(`Mock payment captured and booking created: '${newBooking._id}'`);
      return res.json({ success: true, message: "Booking confirmed successfully!", booking: newBooking });
    } else {
      await payment.save();
      console.log(`Mock payment updated to status: '${status}'`);
      return res.json({ success: true, message: `Mock payment marked as ${status}` });
    }
  } catch (err) {
    console.error("Mock payment verification error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/bookings/payments
module.exports.getPaymentHistory = async (req, res) => {
  try {
    console.log(`\n--- FETCH PAYMENT HISTORY: User ID: '${req.user._id}' ---`);
    const payments = await Payment.find({ user: req.user._id })
      .populate("listing")
      .populate("booking")
      .sort({ createdAt: -1 });

    res.json({ success: true, payments });
  } catch (err) {
    console.error("Fetch payments history error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/bookings/my-bookings
module.exports.getUserBookings = async (req, res) => {
  try {
    console.log(`\n--- FETCH USER BOOKINGS: User ID: '${req.user._id}' ---`);
    const bookings = await Booking.find({ user: req.user._id })
      .populate("listing")
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (err) {
    console.error("Fetch user bookings error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/bookings/host-bookings
module.exports.getHostBookings = async (req, res) => {
  try {
    console.log(`\n--- FETCH HOST BOOKINGS: Host ID: '${req.user._id}' ---`);
    // Find all listings owned by this user
    const hostListings = await Listing.find({ owner: req.user._id }).select("_id");
    const listingIds = hostListings.map((l) => l._id);

    // Find bookings on those listings
    const bookings = await Booking.find({ listing: { $in: listingIds } })
      .populate("listing")
      .populate("user", "username email")
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (err) {
    console.error("Fetch host bookings error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/bookings/:id
module.exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`\n--- CANCEL BOOKING REQUEST: Booking ID: '${id}', User ID: '${req.user._id}' ---`);

    const booking = await Booking.findById(id).populate("listing");
    if (!booking) {
      return res.status(404).json({ success: false, error: "Booking not found!" });
    }

    // Verify authorized user (either guest who booked, or host owner of property)
    const isGuest = booking.user.toString() === req.user._id.toString();
    const isHost = booking.listing.owner.toString() === req.user._id.toString();

    if (!isGuest && !isHost) {
      return res.status(403).json({ success: false, error: "You are not authorized to cancel this booking." });
    }

    booking.status = "cancelled";
    await booking.save();
    console.log("Booking successfully marked as cancelled in DB");

    // Send notifications to guest and host
    if (booking.listing) {
      const Notification = require("../models/notification");
      
      // 1. Notify guest
      const guestNotif = new Notification({
        user: booking.user,
        title: "Stay Cancelled ❌",
        message: `Your reservation for stay at ${booking.listing.title} has been cancelled.`,
        type: "booking_cancelled"
      });
      await guestNotif.save();

      // 2. Notify host
      const hostNotif = new Notification({
        user: booking.listing.owner,
        title: "Reservation Cancelled",
        message: `Stay booking for ${booking.listing.title} has been cancelled by guest.`,
        type: "booking_cancelled"
      });
      await hostNotif.save();

      // 3. Send cancellation email to guest
      const User = require("../models/user");
      const guestUser = await User.findById(booking.user);
      if (guestUser) {
        const { sendBookingCancellationEmail } = require("../utils/email");
        sendBookingCancellationEmail(guestUser, booking, booking.listing).catch(err => console.error("Email cancel failed:", err));
      }
    }

    res.json({ success: true, message: "Booking cancelled successfully!" });
  } catch (err) {
    console.error("Cancel booking error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/bookings/listing/:listingId/reserved-dates
module.exports.getReservedDates = async (req, res) => {
  try {
    const { listingId } = req.params;
    console.log(`\n--- FETCH RESERVED DATES: Listing ID: '${listingId}' ---`);

    const bookings = await Booking.find({
      listing: listingId,
      status: "confirmed"
    }).select("checkIn checkOut");

    const reservedRanges = bookings.map((b) => ({
      start: b.checkIn,
      end: b.checkOut
    }));

    res.json({ success: true, reservedRanges });
  } catch (err) {
    console.error("Fetch reserved dates error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
