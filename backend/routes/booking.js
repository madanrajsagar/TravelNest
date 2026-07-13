const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn } = require("../middleware");
const bookingsController = require("../controllers/bookings");

// All booking routes require JWT logged in check
router.use(isLoggedIn);

router.post("/order", wrapAsync(bookingsController.createOrder));
router.post("/verify", wrapAsync(bookingsController.verifyPayment));
router.post("/mock-verify", wrapAsync(bookingsController.verifyMockPayment));
router.get("/payments", wrapAsync(bookingsController.getPaymentHistory));
router.get("/my-bookings", wrapAsync(bookingsController.getUserBookings));
router.get("/host-bookings", wrapAsync(bookingsController.getHostBookings));
router.get("/listing/:listingId/reserved-dates", wrapAsync(bookingsController.getReservedDates));
router.delete("/:id", wrapAsync(bookingsController.cancelBooking));

module.exports = router;
