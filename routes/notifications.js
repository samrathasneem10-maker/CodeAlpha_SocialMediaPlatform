const router = require("express").Router();
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");

router.get("/", auth, async (req,res) => {
  const list = await Notification.find({recipient:req.user._id})
    .sort({createdAt:-1}).limit(60)
    .populate("actor","username name profileImage")
    .populate("post","image");
  res.json(list);
});

router.post("/read", auth, async (req,res) => {
  await Notification.updateMany({recipient:req.user._id, read:false}, {$set:{read:true}});
  res.json({ok:true});
});
module.exports=router;
