const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

const otpStore = new Map();

router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

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

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Language Verification OTP",
      text: `Your OTP is ${otp}`,
    });
    console.log("GENERATED OTP:", otp);
console.log("EMAIL:", email);

    res.json({
      success: true,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  const savedOtp = otpStore.get(email);

  console.log("EMAIL:", email);
  console.log("USER OTP:", otp);
  console.log("SAVED OTP:", savedOtp);

  if (savedOtp !== otp) {
    return res.status(400).json({
      success: false,
      message: "Invalid OTP"
    });
  }

  res.json({
    success: true
  });
});

module.exports = router;