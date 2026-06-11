const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

// Add this right at the top to load variables into this module context
require("dotenv").config();

const otpStore = new Map();

router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email parameter is required." });
    }

    console.log("REQUEST TARGET EMAIL:", email);
    console.log("SENDER ENV EMAIL:", process.env.EMAIL);
    console.log("SENDER PASSWORD LOADED:", !!process.env.EMAIL_PASSWORD);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, otp);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Verification OTP - Intern Area",
      text: `Your dynamic security authorization token code is ${otp}. Please do not share this code.`,
    });

    console.log("GENERATED OTP:", otp);

    return res.json({
      success: true,
    });
  } catch (err) {
    console.error("Nodemailer Operational Failure:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  const savedOtp = otpStore.get(email);

  console.log("VERIFY LOGS -> Email:", email, " | Input OTP:", otp, " | Saved OTP:", savedOtp);

  if (!savedOtp || savedOtp !== otp) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired OTP"
    });
  }

  // Clear token once successfully authenticated so it cannot be used again
  otpStore.delete(email);

  return res.json({
    success: true
  });
});

module.exports = router;