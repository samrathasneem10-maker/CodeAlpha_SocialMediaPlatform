const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../models/User");
const Notification = require("../models/Notification");
const Post = require("../models/Post");
const auth = require("../middleware/auth");

const uploadDir = path.join(__dirname, "..", "public/uploads");
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, Date.now() + "-" + Math.random().toString(36).slice(2) + path.extname(file.originalname).toLowerCase())
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, ["image/jpeg","image/png","image/webp","image/gif"].includes(file.mimetype))
});

const publicUser = u => ({
  _id: u._id, username: u.username, name: u.name, bio: u.bio, website: u.website,
  profileImage: u.profileImage, followersCount: u.followers?.length || 0, followingCount: u.following?.length || 0
});

router.get("/search", auth, async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json([]);
  const users = await User.find({ $or: [
    { username: { $regex: q, $options: "i" } },
    { name: { $regex: q, $options: "i" } }
  ] }).limit(10);
  res.json(users.map(publicUser));
});

router.get("/me", auth, async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.get("/me/followers", auth, async (req, res) => {
  await req.user.populate("followers", "username name profileImage");
  res.json(req.user.followers);
});
router.get("/me/following", auth, async (req, res) => {
  await req.user.populate("following", "username name profileImage");
  res.json(req.user.following);
});

router.get("/:username", auth, async (req, res) => {
  const user = await User.findOne({ username: req.params.username.toLowerCase() });
  if (!user) return res.status(404).json({ message: "User not found." });
  const posts = await Post.find({ author: user._id }).sort({ createdAt: -1 });
  res.json({
    user: publicUser(user),
    isSelf: req.user._id.equals(user._id),
    isFollowing: user.followers.some(x => x.equals(req.user._id)),
    posts
  });
});

router.put("/me", auth, async (req, res) => {
  const allowed = ["name","bio","website"];
  allowed.forEach(k => { if (req.body[k] !== undefined) req.user[k] = String(req.body[k]).slice(0, k === "bio" ? 300 : 120); });
  await req.user.save();
  res.json({ user: publicUser(req.user) });
});

router.post("/me/avatar", auth, upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Please upload a JPG, PNG, WEBP or GIF image under 5MB." });
  req.user.profileImage = "/uploads/" + req.file.filename;
  await req.user.save();
  res.json({ user: publicUser(req.user) });
});

router.post("/:username/follow", auth, async (req, res) => {
  const target = await User.findOne({ username: req.params.username.toLowerCase() });
  if (!target) return res.status(404).json({ message: "User not found." });
  if (target._id.equals(req.user._id)) return res.status(400).json({ message: "You cannot follow yourself." });

  const following = target.followers.some(x => x.equals(req.user._id));
  if (following) {
    target.followers.pull(req.user._id);
    req.user.following.pull(target._id);
  } else {
    target.followers.addToSet(req.user._id);
    req.user.following.addToSet(target._id);
    await Notification.create({ recipient: target._id, actor: req.user._id, type: "follow" });
  }
  await target.save(); await req.user.save();
  res.json({ following: !following, followersCount: target.followers.length });
});

module.exports = router;
