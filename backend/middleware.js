const Listing = require("./models/listing");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");
const Review = require("./models/review.js");

const jwt = require("jsonwebtoken");
const User = require("./models/user");

module.exports.isLoggedIn = async (req, res, next) => {
  console.log("\n--- MIDDLEWARE CHECK: isLoggedIn ---");
  try {
    let token = req.cookies.token;
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      } else {
        token = req.headers.authorization;
      }
    }
    
    if (!token) {
      console.warn("isLoggedIn check: Token cookie or Authorization header is missing");
      return res.status(401).json({ success: false, error: "You must be logged in!" });
    }

    console.log("Verifying isLoggedIn token...");
    const secret = process.env.JWT_SECRET || process.env.SECRET || "fallbacksecret";
    const decoded = jwt.verify(token, secret);
    
    console.log(`Token verified. Fetching user ID: '${decoded.id}'`);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      console.warn(`isLoggedIn check: User record with ID '${decoded.id}' not found in DB`);
      return res.status(401).json({ success: false, error: "User not found!" });
    }

    // Ban and suspension checks
    if (user.isBanned) {
      console.warn(`isLoggedIn check: Access denied. User @${user.username} is banned.`);
      res.clearCookie("token");
      return res.status(401).json({ success: false, error: "Your account has been permanently banned from TravelNest." });
    }

    if (user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) {
      const suspensionDate = new Date(user.suspendedUntil).toLocaleString();
      console.warn(`isLoggedIn check: Access denied. User @${user.username} is suspended until ${suspensionDate}.`);
      res.clearCookie("token");
      return res.status(401).json({ success: false, error: `Your account is temporarily suspended until ${suspensionDate}.` });
    }

    console.log(`isLoggedIn check: Authorized as @${user.username}`);
    req.user = user;
    next();
  } catch (err) {
    console.error("isLoggedIn check failed:", err.message);
    return res.status(401).json({ success: false, error: "Invalid or expired session. Please log in again." });
  }
};

module.exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ success: false, error: "Access denied. Admins only." });
  }
};

module.exports.isOwner = async (req, res, next) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);
  if (!listing) {
    return res.status(404).json({ success: false, error: "Listing not found!" });
  }
  if (!req.user || !listing.owner.equals(req.user._id)) {
    return res.status(403).json({ success: false, error: "You are not authorized to do that!" });
  }
  next();
};

module.exports.validateListing = (req, res, next) => {
  // If parsing issues occurred or multipart data wasn't wrapped properly, reconstruct listings object
  if (!req.body.listings) {
    let listings = {};
    for (let key in req.body) {
      if (key.startsWith("listings[")) {
        let field = key.slice(9, -1);
        listings[field] = req.body[key];
      }
    }
    if (Object.keys(listings).length > 0) {
      req.body.listings = listings;
    }
  }
  let { error } = listingSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    return res.status(400).json({ success: false, error: errMsg });
  } else {
    next();
  }
};

module.exports.validateReview = (req, res, next) => {
  let { error } = reviewSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    return res.status(400).json({ success: false, error: errMsg });
  } else {
    next();
  }
};

module.exports.isReviewAuthor = async (req, res, next) => {
  let { id, reviewId } = req.params;
  let review = await Review.findById(reviewId);
  if (!review) {
    return res.status(404).json({ success: false, error: "Review not found!" });
  }
  if (!req.user || !review.author.equals(req.user._id)) {
    return res.status(403).json({ success: false, error: "You are not the author of this review!" });
  }
  next();
};

