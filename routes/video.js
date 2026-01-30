const express = require("express");
const router = express.Router();
const Video = require("../models/Video");

// GET all uploaded videos
router.get("/", async (req, res) => {
  try {
    const videos = await Video.find().sort({ uploadedAt: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch videos" });
  }
});

module.exports = router;
