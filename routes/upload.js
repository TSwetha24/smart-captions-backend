const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const { exec } = require("child_process");

const router = express.Router();

/* ---------------- MULTER SETUP ---------------- */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

/* ---------------- FORMAT TIME ---------------- */

function formatTime(seconds) {
  const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const secs = String(Math.floor(seconds % 60)).padStart(2, "0");
  const ms = String(Math.floor((seconds % 1) * 1000)).padStart(3, "0");
  return `${hrs}:${mins}:${secs},${ms}`;
}

/* ---------------- WHISPER TRANSCRIBE ---------------- */

function transcribeAudio(audioPath) {
  return new Promise((resolve, reject) => {
    const outputDir = path.join(__dirname, "../temp");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const command = `python -m whisper "${audioPath}" --model base --output_dir "${outputDir}" --output_format json`;

    exec(command, (error) => {
      if (error) return reject(error);

      const fileName = path.basename(audioPath, ".wav") + ".json";
      const transcriptPath = path.join(outputDir, fileName);

      if (!fs.existsSync(transcriptPath))
        return reject("Transcript JSON not found");

      const transcriptJSON = JSON.parse(
        fs.readFileSync(transcriptPath, "utf-8")
      );

      resolve(transcriptJSON);
    });
  });
}

/* ---------------- GENERATE SRT ---------------- */

function generateSRT(whisperData) {
  let srt = "";
  let index = 1;

  whisperData.segments.forEach((segment) => {
    srt += `${index}\n`;
    srt += `${formatTime(segment.start)} --> ${formatTime(segment.end)}\n`;
    srt += `${segment.text.trim()}\n\n`;
    index++;
  });

  return srt;
}

/* ---------------- BURN SUBTITLE (WINDOWS FIXED) ---------------- */

function burnStyledSubtitle(videoPath, srtPath, outputPath) {
  return new Promise((resolve, reject) => {

    // Convert to forward slashes
    let safeVideoPath = videoPath.replace(/\\/g, "/");
    let safeSrtPath = srtPath.replace(/\\/g, "/");
    let safeOutputPath = outputPath.replace(/\\/g, "/");

    // Escape drive letter colon for ffmpeg
    safeSrtPath = safeSrtPath.replace("C:/", "C\\\\:/");

    ffmpeg(safeVideoPath)
      .outputOptions([
        "-vf",
        `subtitles=${safeSrtPath}:force_style='FontSize=24,PrimaryColour=&Hffffff&,OutlineColour=&H000000&,BorderStyle=3,Outline=2,Alignment=2'`,
        "-c:v libx264",
        "-preset ultrafast",
        "-c:a copy"
      ])
      .save(safeOutputPath)
      .on("end", () => {
        console.log("Subtitles burned successfully");
        resolve();
      })
      .on("error", (err) => {
        console.error("FFmpeg Burn Error:", err);
        reject(err);
      });
  });
}

/* ---------------- MAIN ROUTE ---------------- */

router.post("/", upload.single("video"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "No video uploaded" });

    const videoPath = req.file.path;
    const baseName = path.basename(videoPath, path.extname(videoPath));

    /* ---------- AUDIO EXTRACTION ---------- */

    const audioDir = path.join(__dirname, "../audio");
    if (!fs.existsSync(audioDir))
      fs.mkdirSync(audioDir, { recursive: true });

    const audioPath = path.join(audioDir, Date.now() + ".wav");

    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .noVideo()
        .audioCodec("pcm_s16le")
        .format("wav")
        .save(audioPath)
        .on("end", resolve)
        .on("error", reject);
    });

    /* ---------- WHISPER ---------- */

    const whisperJSON = await transcribeAudio(audioPath);

    /* ---------- GENERATE SRT ---------- */

    const srtDir = path.join(__dirname, "../captions");
    if (!fs.existsSync(srtDir))
      fs.mkdirSync(srtDir, { recursive: true });

    const srtPath = path.join(srtDir, baseName + ".srt");

    const srtContent = generateSRT(whisperJSON);
    fs.writeFileSync(srtPath, srtContent);

    /* ---------- BURN SUBTITLE ---------- */

    const finalDir = path.join(__dirname, "../final");
    if (!fs.existsSync(finalDir))
      fs.mkdirSync(finalDir, { recursive: true });

    const outputVideoPath = path.join(
      finalDir,
      baseName + "_captioned.mp4"
    );

    await burnStyledSubtitle(videoPath, srtPath, outputVideoPath);

    /* ---------- DOWNLOAD FINAL VIDEO ---------- */

    res.download(outputVideoPath);

  } catch (err) {
    console.error("Processing failed:", err);
    res.status(500).json({ error: "Processing failed" });
  }
});

module.exports = router;