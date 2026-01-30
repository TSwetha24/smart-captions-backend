const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

/* Storage configuration */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

/* File filter: Video-only */
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("Only video files are allowed"), false);
  }
};

/* Multer config with FILE SIZE LIMIT (50MB) */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB
  }
});

/* Upload route */
router.post("/", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  res.status(200).json({
    message: "Upload successful",
    file: req.file.filename
  });
});

/* Error handler for Multer */
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});
module.exports = router;
// Get all uploaded videos
router.get("/videos", async (req, res) => {
  try {
    const videos = await Video.find().sort({ uploadedAt: -1 });
    res.json({
      count: videos.length,
      videos
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch videos",
      error: err.message
    });
  }
});
