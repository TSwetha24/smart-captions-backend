const express = require("express");
const cors = require("cors");
const path = require("path");

const uploadRoute = require("./routes/upload");
const videoRoute = require("./routes/video");

const app = express();

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(cors());
app.use(express.json());

app.use("/api/upload", uploadRoute);
app.use("/api/video", videoRoute);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
