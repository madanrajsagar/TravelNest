const Listing = require("../models/listing");

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({}).populate("owner").populate("reviews");
  res.json(allListings);
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findByIdAndUpdate(
    id,
    { $inc: { views: 1 } },
    { new: true }
  )
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");
  if (!listing) {
    return res.status(404).json({ success: false, error: "Listing you requested for does not exist!" });
  }
  res.json({ listing, maptilerApiKey: process.env.MAPTILER_API_KEY });
};

module.exports.createListing = async (req, res, next) => {
  let listingsData = req.body.listings;
  if (!listingsData) {
    listingsData = {};
    for (let key in req.body) {
      if (key.startsWith("listings[")) {
        let field = key.slice(9, -1);
        listingsData[field] = req.body[key];
      }
    }
  }

  const newListing = new Listing(listingsData);
  const response = await fetch(
    `https://api.maptiler.com/geocoding/${encodeURIComponent(newListing.location)}.json?key=${process.env.MAPTILER_API_KEY}`
  );
  const data = await response.json();

  if (!data.features || !data.features.length) {
    return res.status(400).json({ success: false, error: "Invalid location!" });
  }

  newListing.geometry = {
    type: "Point",
    coordinates: data.features[0].geometry.coordinates
  };

  newListing.owner = req.user._id;

  // Process files
  let imagesList = [];
  if (req.files && req.files.length > 0) {
    imagesList = req.files.map(f => ({ url: f.path, filename: f.filename }));
  }

  // Cover image shuffle based on index parameter
  const coverIdx = parseInt(req.body.coverIndex) || 0;
  if (imagesList.length > 0 && coverIdx < imagesList.length) {
    const coverImg = imagesList[coverIdx];
    imagesList.splice(coverIdx, 1);
    imagesList.unshift(coverImg);
  }

  newListing.images = imagesList;
  newListing.image = imagesList.length > 0 ? imagesList[0] : { url: "", filename: "" };

  await newListing.save();
  res.json({ success: true, message: "New Listing Created!", listing: newListing });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;

  let listingsData = req.body.listings;
  if (!listingsData) {
    listingsData = {};
    for (let key in req.body) {
      if (key.startsWith("listings[")) {
        let field = key.slice(9, -1);
        listingsData[field] = req.body[key];
      }
    }
  }

  let listing = await Listing.findById(id);
  if (!listing) {
    return res.status(404).json({ success: false, error: "Listing you requested for does not exist!" });
  }

  // Handle remaining existing images
  let existingImages = [];
  if (req.body.existingImages) {
    try {
      existingImages = JSON.parse(req.body.existingImages);
    } catch (e) {
      console.error("Failed to parse existing images:", e);
    }
  } else {
    existingImages = listing.images || [];
  }

  // Handle new uploaded images
  let newImages = [];
  if (req.files && req.files.length > 0) {
    newImages = req.files.map(f => ({ url: f.path, filename: f.filename }));
  }

  const finalImages = [...existingImages, ...newImages];

  // Set Cover Image index
  const coverIdx = parseInt(req.body.coverIndex) || 0;
  if (finalImages.length > 0 && coverIdx < finalImages.length) {
    const coverImg = finalImages[coverIdx];
    finalImages.splice(coverIdx, 1);
    finalImages.unshift(coverImg);
  }

  // Assign updated listings fields
  Object.assign(listing, listingsData);
  listing.images = finalImages;
  listing.image = finalImages.length > 0 ? finalImages[0] : { url: "", filename: "" };

  await listing.save();
  res.json({ success: true, message: "Listing Updated!", listing });
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id);
  res.json({ success: true, message: "Listing Deleted!" });
};