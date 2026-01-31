const fs = require("fs");
const path = require("path");

const formatTime = (seconds, type) => {
  const date = new Date(seconds * 1000).toISOString();
  return type === "srt"
    ? date.substr(11, 8).replace(".", ",") + ",000"
    : date.substr(11, 12);
};

const generateCaptions = (segments, videoName, type = "srt") => {
  const captionsDir = path.join(__dirname, "../uploads/captions");
  if (!fs.existsSync(captionsDir)) {
    fs.mkdirSync(captionsDir, { recursive: true });
  }

  const filename = `${videoName}.${type}`;
  const fullPath = path.join(captionsDir, filename);

  let content = type === "vtt" ? "WEBVTT\n\n" : "";

  segments.forEach((seg, i) => {
    if (type === "srt") content += `${i + 1}\n`;
    content += `${formatTime(seg.start, type)} --> ${formatTime(seg.end, type)}\n`;
    content += `${seg.text.trim()}\n\n`;
  });

  fs.writeFileSync(fullPath, content, "utf8");

  return {
    filename,
    fullPath   // 🔥 THIS IS WHAT WAS MISSING
  };
};

module.exports = generateCaptions;
