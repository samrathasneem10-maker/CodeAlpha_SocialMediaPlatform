require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Post = require("./models/Post");
const Comment = require("./models/Comment");
const Notification = require("./models/Notification");

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/codealpha_novasocial";
const pics = [
  "/images/post-01.svg",
  "/images/post-02.svg",
  "/images/post-03.svg",
  "/images/post-04.svg",
  "/images/post-05.svg",
  "/images/post-06.svg"
];
const avatars = [
  "/images/avatar-samra.svg",
  "/images/avatar-alex.svg",
  "/images/avatar-mia.svg",
  "/images/avatar-daniel.svg",
  "/images/avatar-sarah.svg",
  "/images/avatar-emma.svg"
];

(async()=>{
  await mongoose.connect(uri);
  await Promise.all([Notification.deleteMany({}), Comment.deleteMany({}), Post.deleteMany({}), User.deleteMany({})]);
  const password = await bcrypt.hash("Password123!",12);
  const raw = [
    ["samra","Samra Fathima","samra@example.com","Computer Science Undergraduate • Web Developer | UI/UX"],
    ["alex","Alex Morgan","alex@example.com","Photographer • Colombo"],
    ["mia","Mia Fernando","mia@example.com","Product designer & coffee lover"],
    ["daniel","Daniel Perera","daniel@example.com","Developer • Building useful things"],
    ["sarah","Sarah Silva","sarah@example.com","Travel • Design • Stories"],
    ["emma","Emma Jay","emma@example.com","Creative technologist"]
  ];
  const users = [];
  for(let i=0;i<raw.length;i++){
    const [username,name,email,bio]=raw[i];
    users.push(await User.create({username,name,email,password,bio,profileImage:avatars[i],website:i===0?"https://example.com":""}));
  }
  const samra=users[0];
  for(const u of users.slice(1,5)) { samra.following.addToSet(u._id); u.followers.addToSet(samra._id); }
  await samra.save();
  await Promise.all(users.slice(1,5).map(u=>u.save()));
  const captions=[
    "City lights, calm nights ✨",
    "A little escape from the usual routine.",
    "Designing moments worth remembering.",
    "Green spaces and fresh ideas 🌿",
    "Weekend frames from Colombo 🌅",
    "Keep building. Keep learning. Keep sharing."
  ];
  for(let i=0;i<12;i++){
    await Post.create({
      author: users[i%users.length]._id,
      image:pics[i%pics.length],
      caption:captions[i%captions.length],
      location:i%2===0?"Colombo, Sri Lanka":"Galle, Sri Lanka",
      likes: i%3===0 ? [samra._id] : [],
      savedBy: i%4===0 ? [samra._id] : []
    });
  }
  const posts=await Post.find({}).limit(4);
  await Comment.create({post:posts[0]._id,author:users[1]._id,text:"This looks amazing! ✨"});
  await Comment.create({post:posts[0]._id,author:users[2]._id,text:"Love the atmosphere."});
  await Notification.create({recipient:samra._id,actor:users[1]._id,type:"follow"});
  await Notification.create({recipient:samra._id,actor:users[2]._id,type:"like",post:posts[0]._id});
  console.log("Seed complete.");
  console.log("Demo login: samra@example.com / Password123!");
  await mongoose.disconnect();
})().catch(e=>{console.error(e);process.exit(1)});
