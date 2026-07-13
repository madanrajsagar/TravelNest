const User = require("../models/user");

// GET /api/wishlist
module.exports.getWishlist = async (req, res) => {
  try {
    console.log(`\n--- FETCH WISHLIST REQUEST: User ID: '${req.user._id}' ---`);
    const user = await User.findById(req.user._id).populate({
      path: "wishlist"
    });
    
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found!" });
    }

    console.log(`Fetched wishlist with ${user.wishlist?.length || 0} listings`);
    res.json({ success: true, wishlist: user.wishlist || [] });
  } catch (err) {
    console.error("Fetch wishlist error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/wishlist/:listingId
module.exports.addToWishlist = async (req, res) => {
  try {
    const { listingId } = req.params;
    console.log(`\n--- ADD TO WISHLIST REQUEST: User ID: '${req.user._id}', Listing ID: '${listingId}' ---`);
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found!" });
    }

    if (!user.wishlist.includes(listingId)) {
      user.wishlist.push(listingId);
      await user.save();
      console.log("Listing successfully added to user wishlist in DB");
    } else {
      console.log("Listing already exists in user wishlist");
    }

    res.json({ success: true, message: "Added to wishlist" });
  } catch (err) {
    console.error("Add to wishlist error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/wishlist/:listingId
module.exports.removeFromWishlist = async (req, res) => {
  try {
    const { listingId } = req.params;
    console.log(`\n--- REMOVE FROM WISHLIST REQUEST: User ID: '${req.user._id}', Listing ID: '${listingId}' ---`);
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found!" });
    }

    user.wishlist = user.wishlist.filter((id) => id.toString() !== listingId);
    await user.save();
    console.log("Listing successfully removed from user wishlist in DB");

    res.json({ success: true, message: "Removed from wishlist" });
  } catch (err) {
    console.error("Remove from wishlist error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
