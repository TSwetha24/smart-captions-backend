const { exec } = require("child_process");
const path = require("path");

const speechToText = (audioPath) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "../python/transcribe.py");

    const command = `python "${scriptPath}" "${audioPath}"`;

    exec(command, { maxBuffer: 1024 * 5000 }, (error, stdout, stderr) => {
      if (error) {
        console.error(stderr);
        return reject(error);
      }

      try {
        const segments = JSON.parse(stdout);
        resolve(segments);
      } catch (err) {
        reject(err);
      }
    });
  });
};

module.exports = speechToText;
