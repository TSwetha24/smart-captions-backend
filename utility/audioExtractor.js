const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const path = require("path");
const fs = require("fs"); //

ffmpeg.setFfmpegPath(ffmpegPath);

const extractAudio = (videoPath) => {
  return new Promise((resolve, reject) => {
    const audioDir = path.join(__dirname, "..", "uploads", "audio");

    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const audioPath = path.join(
      audioDir,
      path.basename(videoPath, path.extname(videoPath)) + ".wav"
    );

    ffmpeg(videoPath)
      .output(audioPath)
      .noVideo()
      .audioCodec("pcm_s16le")
      .audioChannels(1)
      .audioFrequency(16000)
      .on("end", () => resolve(audioPath))
      .on("error", (err) => reject(err))
      .run();
  });
};

module.exports = extractAudio;
