const express = require("express");
const path = require("path");
const fs = require("fs");
const router = express.Router();

const burnCaptions = require("../utility/burnCaptions");
const extractAudio = require("../utility/audioExtractor");
const speechToText = require("../utility/speechToText");
const generateCaptions = require("../utility/captiongenerator");

router.post("/process/:filename", async (req, res) => {
  try {
    const videoPath = path.join(__dirname, "..", "uploads", req.params.filename);

    // ✅ 1. Ensure video exists
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ message: "Video file not found" });
    }

    // 2️⃣ Extract audio
    const audioPath = await extractAudio(videoPath);

    // 3️⃣ Speech → Text
    const segments = await speechToText(audioPath);

    // 4️⃣ Generate captions
    const videoName = path.parse(req.params.filename).name;
    const srt = generateCaptions(segments, videoName, "srt");

    // ✅ 2. Ensure SRT exists (THIS WAS MISSING BEFORE)
    if (!fs.existsSync(srt.fullPath)) {
      throw new Error("SRT file not created: " + srt.fullPath);
    }

    // 5️⃣ Burn captions into video
    const outputVideoPath = await burnCaptions(videoPath, srt.fullPath);

    res.json({
      message: "Video exported with synced captions",
      captionFile: srt.filename,
      outputVideo: path.basename(outputVideoPath)
    });

  } catch (err) {
    console.error("❌ PROCESS ERROR:", err);
    res.status(500).json({
      message: "Video caption export failed",
      error: err.message
    });
  }
});

module.exports = router;
