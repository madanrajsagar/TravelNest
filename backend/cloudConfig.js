const cloudinary = require('cloudinary').v2;
const multerStorage = require('multer-storage-cloudinary');

// Handle both object export (modern v3/v4) and direct function export (older v2)
const CloudinaryStorage = multerStorage.CloudinaryStorage || multerStorage;

cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUD_API_KEY,
    api_secret:process.env.CLOUD_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  // For modern multer-storage-cloudinary (v3/v4)
  params: {
    folder: 'wanderlust_DEV',
    allowed_formats: ["png","jpg","jpeg"],
  },
  // Fallbacks for older multer-storage-cloudinary (v2)
  folder: 'wanderlust_DEV',
  allowedFormats: ["png","jpg","jpeg"],
});


module.exports={
    cloudinary,
    storage,
};