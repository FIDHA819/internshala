// Routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../Model/User");

// JWT Secret - Fallback to a string if it's missing in .env
const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key_here";

// --- REGISTER ROUTE ---
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: "An account with this email already exists." });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create and save new user
    const newUser = new User({
      email,
      password: hashedPassword
    });
    await newUser.save();

    // Generate an automatic login token for immediate access
    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(201).json({
      success: true,
      message: "Registration successful!",
      user: {
        id: newUser._id,
        email: newUser.email,
        photo: newUser.photo
      },
      token
    });
  } catch (err) {
    console.error("Registration Error:", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// --- LOGIN ROUTE ---
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid email or password." });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid email or password." });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      success: true,
      message: "Logged in successfully!",
      user: {
        id: user._id,
        email: user.email,
        photo: user.photo
      },
      token
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// --- LOGOUT ROUTE ---
router.post("/logout", (req, res) => {
  // For client-side local/Redux token clearance, a clean return is sufficient
  return res.json({ success: true, message: "Logged out successfully." });
});

// --- GOOGLE LOGIN ROUTE ---
router.post("/google-login", async (req, res) => {
  try {
    console.log("GOOGLE LOGIN HIT");
    console.log(req.body);

    const { email, photo } = req.body;

    let user = await User.findOne({ email });

    console.log("USER FOUND:", user);

    if (!user) {
      console.log("CREATING USER");

      user = await User.create({
        email,
        password: "GOOGLE_AUTH_USER",
        photo: photo || "",
      });
    }

    const token = jwt.sign(
      { id: user._id },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("TOKEN CREATED");

    return res.status(200).json({
      success: true,
       token,
  user: {
    id: user._id,
    email: user.email,
    photo: user.photo,
    friends: user.friends,
    dailyPostCount: user.dailyPostCount,
    friendRequestsReceived:
      user.friendRequestsReceived
  }
    });

  } catch (err) {
    console.error("GOOGLE LOGIN ERROR:");
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


module.exports = router;