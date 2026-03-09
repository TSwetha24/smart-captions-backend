function formatTime(seconds) {
  const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const secs = String(Math.floor(seconds % 60)).padStart(2, "0");
  const ms = String(Math.floor((seconds % 1) * 1000)).padStart(3, "0");

  return `${hrs}:${mins}:${secs},${ms}`;
}

function generateSRTFromWhisper(whisperData) {
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

module.exports = generateSRTFromWhisper;