require("dotenv").config();   // ✅ ADD THIS AT THE TOP

const express = require("express");
const uploadRoute = require("./routes/upload");

const app = express();

app.use("/api/upload", uploadRoute);

app.use((err, req, res, next) => {
  if (err.message === "Only video files allowed") {
    return res.status(400).json({
      error: "Please upload a valid video file (mp4, mkv, avi)"
    });
  }
  res.status(500).json({ error: "Server error" });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
console.log(process.env.R2_BUCKET);
