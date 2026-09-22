const router = require("express").Router();
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const auth = require("../middleware/auth");

router.get("/:postId", auth, async (req,res) => {
  const comments = await Comment.find({ post: req.params.postId }).sort({createdAt:1}).populate("author","username name profileImage");
  res.json(comments);
});

router.post("/:postId", auth, async (req,res) => {
  const text = String(req.body.text || "").trim();
  if (!text) return res.status(400).json({message:"Comment cannot be empty."});
  const post = await Post.findById(req.params.postId);
  if (!post) return res.status(404).json({message:"Post not found."});
  const comment = await Comment.create({post:post._id,author:req.user._id,text:text.slice(0,500)});
  await comment.populate("author","username name profileImage");
  res.status(201).json(comment);
});
module.exports=router;
