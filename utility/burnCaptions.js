const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const burnCaptions = (videoPath, srtPath) => {
  return new Promise((resolve, reject) => {
    const outputDir = path.join(__dirname, "../uploads/output");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(
      outputDir,
      path.parse(videoPath).name + "_captioned.mp4"
    );

    // 🔥 ABSOLUTE PATHS (MANDATORY)
    const video = path.resolve(videoPath).replace(/\\/g, "/");
    const output = path.resolve(outputPath).replace(/\\/g, "/");

    // 🔥 VERY IMPORTANT WINDOWS ESCAPE
    const subtitle = path
      .resolve(srtPath)
      .replace(/\\/g, "/")
      .replace(/^([A-Za-z]):/, "$1\\:");

    const command = `
      ffmpeg -y -i "${video}"
      -vf "subtitles=filename='${subtitle}':force_style='FontSize=24'"
      -c:a copy
      "${output}"
    `.replace(/\s+/g, " ").trim();

    console.log("🎬 FFmpeg command:\n", command);

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(stderr);
        return reject(error);
      }
      resolve(outputPath);
    });
  });
};

module.exports = burnCaptions;
