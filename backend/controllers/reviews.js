const Review = require("../models/review.js");
const Listing = require("../models/listing");

module.exports.createReview = async (req, res) => {
  let listing = await Listing.findById(req.params.id);
  if (!listing) {
    return res.status(404).json({ success: false, error: "Listing not found!" });
  }
  let newReview = new Review(req.body.review);
  newReview.author = req.user._id;
  
  listing.reviews.push(newReview);
  await newReview.save();
  await listing.save();

  // Create Review Notification for the Listing Host Owner
  if (listing.owner.toString() !== req.user._id.toString()) {
    const Notification = require("../models/notification");
    const reviewNotif = new Notification({
      user: listing.owner,
      title: "New Stay Review! ⭐",
      message: `Your listing "${listing.title}" received a new ${newReview.rating}-star review from @${req.user.username}.`,
      type: "review"
    });
    await reviewNotif.save().catch(err => console.error("Review notify failed:", err));
  }
  
  // Populate the author so React can immediately show the author name
  await newReview.populate("author");
  
  res.json({ success: true, message: "New Review Created!", review: newReview });
};

module.exports.destroyReview = async (req, res) => {
  let { id, reviewId } = req.params;
  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);
  res.json({ success: true, message: "Review Deleted!" });
};

module.exports.updateReview = async (req, res) => {
  let { reviewId } = req.params;
  const updatedReview = await Review.findByIdAndUpdate(
    reviewId,
    req.body.review,
    { new: true }
  ).populate("author");
  res.json({ success: true, message: "Review Updated!", review: updatedReview });
};
