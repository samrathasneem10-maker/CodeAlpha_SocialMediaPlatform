require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const auth = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/codealpha_novasocial";

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

app.get("/api/health", (req, res) => res.json({
  ok: true,
  app: "NovaSocial",
  time: new Date().toISOString()
}));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/comments", require("./routes/comments"));
app.use("/api/notifications", require("./routes/notifications"));

app.get("/api/feed", auth, require("./routes/posts").feed);
app.get("/api/explore", auth, require("./routes/posts").explore);
app.get("/api/saved", auth, require("./routes/posts").saved);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

mongoose.connect(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`NovaSocial running at http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error("MongoDB connection failed:", err.message);
    console.error("Make sure MongoDB is running and MONGO_URI is correct.");
    process.exit(1);
  });
