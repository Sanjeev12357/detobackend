const express = require("express");
const multer = require("multer");
const { cloudinary } = require("../utils/cloudinaryConfig");
const uploadRouter = express.Router();

// Configure multer to store files in memory
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// Upload image to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: "profile_pictures", // Optional: organize images in folders
        ...options
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    ).end(buffer);
  });
};

// Image upload endpoint
uploadRouter.post("/image", upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    console.log('Uploading to Cloudinary...');
    
    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, {
      public_id: `profile_${Date.now()}`, // Generate unique public ID
    });

    console.log('Cloudinary upload successful:', result.secure_url);

    res.json({
      success: true,
      message: "Image uploaded successfully to Cloudinary",
      imageUrl: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to upload image to Cloudinary",
      error: error.message
    });
  }
});

module.exports = uploadRouter;
