const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

require("dotenv").config();

const otpStore = new Map();

// SEND OTP
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    console.log("REQUEST EMAIL:", email);
    console.log("SENDER EMAIL:", process.env.EMAIL);
    console.log(
      "EMAIL PASSWORD EXISTS:",
      !!process.env.EMAIL_PASSWORD
    );

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    otpStore.set(email, otp);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Verification OTP",
      text: `Your OTP is ${otp}. It expires soon.`,
    });

    console.log("MAIL SENT SUCCESSFULLY");
    console.log("MESSAGE ID:", info.messageId);
    console.log("GENERATED OTP:", otp);

    return res.json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (err) {
    console.error("MAIL ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// VERIFY OTP
router.post("/verify-otp", (req, res) => {
  try {
    const { email, otp } = req.body;

    const savedOtp = otpStore.get(email);

    console.log(
      "VERIFY OTP:",
      email,
      otp,
      savedOtp
    );

    if (!savedOtp) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    if (savedOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    otpStore.delete(email);

    return res.json({
      success: true,
      message: "OTP verified successfully",
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;