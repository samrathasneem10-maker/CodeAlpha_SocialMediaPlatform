const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");

const uploadDir = path.join(__dirname, "..", "public/uploads");
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, Date.now() + "-" + Math.random().toString(36).slice(2) + path.extname(file.originalname).toLowerCase())
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, ["image/jpeg","image/png","image/webp","image/gif"].includes(file.mimetype))
});

async function populatePosts(query) {
  return query.populate("author", "username name profileImage bio").lean();
}

function shape(p, uid) {
  return {
    ...p,
    likesCount: p.likes?.length || 0,
    commentsCount: 0,
    liked: p.likes?.some(x => String(x) === String(uid)) || false,
    saved: p.savedBy?.some(x => String(x) === String(uid)) || false
  };
}

async function enrich(posts, uid) {
  const ids = posts.map(p => p._id);
  const counts = await Comment.aggregate([{ $match: { post: { $in: ids } } }, { $group: { _id: "$post", count: { $sum: 1 } } }]);
  const map = Object.fromEntries(counts.map(x => [String(x._id), x.count]));
  return posts.map(p => ({ ...shape(p, uid), commentsCount: map[String(p._id)] || 0 }));
}

async function feed(req, res) {
  try {
    const ids = [req.user._id, ...req.user.following];
    const posts = await populatePosts(Post.find({ author: { $in: ids } }).sort({ createdAt: -1 }).limit(50));
    res.json(await enrich(posts, req.user._id));
  } catch { res.status(500).json({ message: "Could not load feed." }); }
}

async function explore(req, res) {
  try {
    const posts = await populatePosts(Post.find({}).sort({ createdAt: -1 }).limit(60));
    res.json(await enrich(posts, req.user._id));
  } catch { res.status(500).json({ message: "Could not load explore." }); }
}

async function saved(req, res) {
  try {
    const posts = await populatePosts(Post.find({ savedBy: req.user._id }).sort({ createdAt: -1 }));
    res.json(await enrich(posts, req.user._id));
  } catch { res.status(500).json({ message: "Could not load saved posts." }); }
}

router.get("/", auth, feed);

router.post("/", auth, upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Image is required and must be under 8MB." });
  const post = await Post.create({
    author: req.user._id,
    image: "/uploads/" + req.file.filename,
    caption: String(req.body.caption || "").slice(0, 2200),
    location: String(req.body.location || "").slice(0, 120)
  });
  const populated = await Post.findById(post._id).populate("author", "username name profileImage").lean();
  res.status(201).json(shape(populated, req.user._id));
});

router.delete("/:id", auth, async (req, res) => {
  const post = await Post.findOne({ _id: req.params.id, author: req.user._id });
  if (!post) return res.status(404).json({ message: "Post not found or you are not the owner." });
  await Comment.deleteMany({ post: post._id });
  await Notification.deleteMany({ post: post._id });
  await post.deleteOne();
  res.json({ ok: true });
});

router.post("/:id/like", auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found." });
  const already = post.likes.some(x => x.equals(req.user._id));
  if (already) post.likes.pull(req.user._id);
  else {
    post.likes.addToSet(req.user._id);
    if (!post.author.equals(req.user._id)) await Notification.create({ recipient: post.author, actor: req.user._id, type: "like", post: post._id });
  }
  await post.save();
  res.json({ liked: !already, likesCount: post.likes.length });
});

router.post("/:id/save", auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found." });
  const saved = post.savedBy.some(x => x.equals(req.user._id));
  if (saved) post.savedBy.pull(req.user._id); else post.savedBy.addToSet(req.user._id);
  await post.save();
  res.json({ saved: !saved });
});

router.get("/:id/comments", auth, async (req, res) => {
  const comments = await Comment.find({ post: req.params.id }).sort({ createdAt: 1 }).populate("author", "username name profileImage");
  res.json(comments);
});

router.post("/:id/comments", auth, async (req, res) => {
  const text = String(req.body.text || "").trim();
  if (!text) return res.status(400).json({ message: "Comment cannot be empty." });
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found." });
  const comment = await Comment.create({ post: post._id, author: req.user._id, text: text.slice(0,500) });
  if (!post.author.equals(req.user._id)) await Notification.create({ recipient: post.author, actor: req.user._id, type: "comment", post: post._id });
  await comment.populate("author", "username name profileImage");
  res.status(201).json(comment);
});

router.get("/:id", auth, async (req, res) => {
  const post = await Post.findById(req.params.id).populate("author", "username name profileImage").lean();
  if (!post) return res.status(404).json({ message: "Post not found." });
  res.json((await enrich([post], req.user._id))[0]);
});

module.exports = router;
module.exports.feed = async (req, res) => { if (!req.user) return res.status(401).json({message:"Authentication required."}); return feed(req,res); };
module.exports.explore = async (req, res) => { if (!req.user) return res.status(401).json({message:"Authentication required."}); return explore(req,res); };
module.exports.saved = async (req, res) => { if (!req.user) return res.status(401).json({message:"Authentication required."}); return saved(req,res); };
