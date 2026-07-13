const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn } = require("../middleware");
const wishlistController = require("../controllers/wishlist");

// All wishlist routes are protected by JWT login check
router.use(isLoggedIn);

router.get("/", wrapAsync(wishlistController.getWishlist));
router.post("/:listingId", wrapAsync(wishlistController.addToWishlist));
router.delete("/:listingId", wrapAsync(wishlistController.removeFromWishlist));

module.exports = router;
