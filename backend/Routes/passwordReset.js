const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs"); // 1. Import bcrypt

const PasswordReset = require("../Model/PasswordReset");
const User = require("../Model/User"); // 2. Import your User model here

function generatePassword() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

router.post("/", async (req, res) => {
  try {
    const { email } = req.body;

    // Verify that the user actually exists in your main User database collection first
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address.",
      });
    }

    // Rate limiting check
    const existing = await PasswordReset.findOne({ email });
    if (existing && existing.lastResetAt) {
      const diff = Date.now() - new Date(existing.lastResetAt).getTime();
      const hours = diff / (1000 * 60 * 60);

      if (hours < 24) {
        return res.json({
          success: false,
          message: "You can use this option only once per day.",
        });
      }
    }

    const generatedPassword = generatePassword();

    // 3. Hash the newly generated password to safely update the User record
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(generatedPassword, salt);

    // 4. Update the actual User document record with the hashed credentials
    await User.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { $set: { password: hashedPassword } }
    );

    // Dispatch notification to user mailbox via nodemailer
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
      subject: "Password Recovery",
      text: `Your generated password is: ${generatedPassword}`,
    });

    // Sync your verification token metadata record collection tracking engine
    await PasswordReset.findOneAndUpdate(
      { email },
      {
        generatedPassword, // Keeps plain text log in this secondary collection if needed for tracking
        lastResetAt: new Date(),
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: "Password sent to email successfully!",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;