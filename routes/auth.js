const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const secret = () => process.env.JWT_SECRET || "dev_secret_change_me";

function tokenFor(user) {
  return jwt.sign({ id: user._id.toString() }, secret(), { expiresIn: "7d" });
}

function safe(user) {
  const obj = user.toObject();
  delete obj.password;
  return obj;
}

router.post("/register", async (req, res) => {
  try {
    const { name, username, email, password, confirmPassword } = req.body;
    if (!name || !username || !email || !password) return res.status(400).json({ message: "All required fields must be filled." });
    if (password !== confirmPassword) return res.status(400).json({ message: "Passwords do not match." });
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters." });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: "Enter a valid email." });
    const cleanUsername = username.toLowerCase().replace(/^@/, "");
    if (!/^[a-z0-9._]{3,30}$/.test(cleanUsername)) return res.status(400).json({ message: "Username may use letters, numbers, dots and underscores." });

    const exists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: cleanUsername }] });
    if (exists) return res.status(409).json({ message: "Username or email is already registered." });

    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, username: cleanUsername, email: email.toLowerCase(), password: hash });
    res.status(201).json({ token: tokenFor(user), user: safe(user) });
  } catch (e) {
    res.status(500).json({ message: "Registration failed." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || "").toLowerCase() });
    if (!user || !(await bcrypt.compare(password || "", user.password))) return res.status(401).json({ message: "Invalid email or password." });
    res.json({ token: tokenFor(user), user: safe(user) });
  } catch {
    res.status(500).json({ message: "Login failed." });
  }
});

module.exports = router;
