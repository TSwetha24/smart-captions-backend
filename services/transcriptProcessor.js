const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

function transcribeAudio(audioPath) {
  return new Promise((resolve, reject) => {
    const outputDir = path.join(__dirname, "../temp");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const command = `python -m whisper "${audioPath}" --model base --output_dir "${outputDir}" --output_format json`;

    console.log("Running Command:", command);

    exec(command, (error) => {
      if (error) {
        console.error("Whisper Error:", error);
        return reject(error);
      }

      const fileName = path.basename(audioPath, ".wav") + ".json";
      const transcriptPath = path.join(outputDir, fileName);

      if (!fs.existsSync(transcriptPath)) {
        return reject("Transcript JSON not found");
      }

      const transcriptJSON = JSON.parse(
        fs.readFileSync(transcriptPath, "utf-8")
      );

      resolve(transcriptJSON);
    });
  });
}

module.exports = transcribeAudio;