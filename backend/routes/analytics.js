const express = require("express");
const router = express.Router();
const Listing = require("../models/listing");
const wrapAsync = require("../utils/wrapAsync");

// GET /api/analytics/listing/:id
router.get(
  "/listing/:id",
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({ success: false, error: "Listing not found" });
    }

    // Query listings in the same location/city, fallback to country
    let nearby = await Listing.find({
      location: listing.location,
      _id: { $ne: listing._id }
    });

    if (nearby.length === 0) {
      nearby = await Listing.find({
        country: listing.country,
        _id: { $ne: listing._id }
      });
    }

    // pricing statistics calculation
    const allPrices = [listing.price, ...nearby.map(l => l.price)];
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const avgPrice = Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length);

    // monthly average price trends generator (based on base listing price + season coefficients)
    const base = listing.price;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const coefficients = [0.95, 0.98, 1.12, 1.15, 1.20, 0.88, 0.82, 0.80, 0.92, 1.08, 1.25, 1.35]; // winter/summer surges

    const monthlyTrends = months.map((m, idx) => ({
      month: m,
      price: Math.round(base * coefficients[idx])
    }));

    // Est savings calculations
    const estimatedSavings = listing.price < avgPrice ? avgPrice - listing.price : 0;
    const percentSavings = avgPrice > 0 ? Math.round((estimatedSavings / avgPrice) * 100) : 0;

    const suggestedMin = Math.round(avgPrice * 0.8);
    const suggestedMax = Math.round(avgPrice * 1.25);

    res.json({
      success: true,
      listingId: id,
      stats: {
        avgPrice,
        minPrice,
        maxPrice,
        estimatedSavings,
        percentSavings,
        suggestedBudgetRange: {
          min: suggestedMin,
          max: suggestedMax
        }
      },
      monthlyTrends,
      comparisonListingsCount: nearby.length
    });
  })
);

module.exports = router;
