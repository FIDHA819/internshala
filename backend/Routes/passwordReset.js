const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

const PasswordReset =
require("../Model/PasswordReset");

function generatePassword() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  let password = "";

  for (let i = 0; i < 10; i++) {
    password += chars.charAt(
      Math.floor(
        Math.random() * chars.length
      )
    );
  }

  return password;
}

router.post("/", async (req, res) => {
  try {
    const { email } = req.body;

    const existing =
      await PasswordReset.findOne({
        email,
      });

    if (
      existing &&
      existing.lastResetAt
    ) {
      const diff =
        Date.now() -
        new Date(
          existing.lastResetAt
        ).getTime();

      const hours =
        diff / (1000 * 60 * 60);

      if (hours < 24) {
        return res.json({
          success: false,
          message:
            "You can use this option only once per day.",
        });
      }
    }

    const generatedPassword =
      generatePassword();

    const transporter =
      nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass:
            process.env.EMAIL_PASSWORD,
        },
      });

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject:
        "Password Recovery",
      text: `Your generated password is: ${generatedPassword}`,
    });

    await PasswordReset.findOneAndUpdate(
      { email },
      {
        generatedPassword,
        lastResetAt: new Date(),
      },
      {
        upsert: true,
      }
    );

    res.json({
      success: true,
      message:
        "Password sent to email",
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