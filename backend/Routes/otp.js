const express = require("express");
const router = express.Router();
const axios = require("axios");

const otpStore = new Map();

const sendEmailViaBrevo = async (
  toEmail,
  subject,
  htmlContent,
  textContent
) => {
  const response = await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: {
        name: "Intern Area",
        email: process.env.FROM_EMAIL,
      },
      to: [{ email: toEmail }],
      subject,
      htmlContent,
      textContent,
    },
    {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    }
  );

  return response.data;
};

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

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    console.log(`[LANG OTP] Generated for ${email}: ${otp}`);

    await sendEmailViaBrevo(
      email,
      " Verification",
      `
      <div style="font-family:sans-serif;padding:20px">
        <h2> Verification</h2>
        <p>Use the OTP below to verify your  change:</p>

        <div style="
          font-size:36px;
          font-weight:bold;
          letter-spacing:8px;
          text-align:center;
          padding:20px;
          background:#f3f4f6;
          border-radius:10px;
        ">
          ${otp}
        </div>

        <p>This OTP expires in 10 minutes.</p>
      </div>
      `,
      `Your OTP is ${otp}. It expires in 10 minutes.`
    );

    console.log(`[LANG OTP] Sent successfully to ${email}`);

    return res.json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (err) {
    console.error(
      "[LANG OTP ERROR]",
      err.response?.data || err.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
});

// VERIFY OTP
router.post("/verify-otp", (req, res) => {
  try {
    const { email, otp } = req.body;

    const saved = otpStore.get(email);

    if (!saved) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    if (Date.now() > saved.expiresAt) {
      otpStore.delete(email);

      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    if (saved.otp !== otp) {
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
      message: "Internal server error",
    });
  }
});

module.exports = router;