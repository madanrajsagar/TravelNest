const mongoose = require("mongoose");
const Listing = require("../models/listing");
require("dotenv").config({ path: "../.env" });

if (!process.env.MAPTILER_API_KEY) {
  console.error("❌ MAPTILER_API_KEY not found");
  process.exit(1);
}

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
  console.log("✅ MongoDB connected");

  const listings = await Listing.find({ geometry: { $exists: false } });
  console.log(`Found ${listings.length} old listings`);

  for (let listing of listings) {
    if (!listing.location) continue;

    const encodedLocation = encodeURIComponent(listing.location);

    const res = await fetch(
      `https://api.maptiler.com/geocoding/${encodedLocation}.json?key=${process.env.MAPTILER_API_KEY}`
    );

    const text = await res.text();

    if (!res.ok) {
      console.error(`❌ Error for ${listing.title}:`, text);
      continue;
    }

    const data = JSON.parse(text);

    if (data.features && data.features.length) {
      listing.geometry = {
        type: "Point",
        coordinates: data.features[0].geometry.coordinates,
      };

      await listing.save();
      console.log(`✔ Updated: ${listing.title}`);
    }
  }

  console.log("🎉 All old listings updated");
  mongoose.connection.close();
}

main().catch(err => {
  console.error(err);
  mongoose.connection.close();
});
