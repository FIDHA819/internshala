const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const PasswordReset = require("../Model/PasswordReset");
const User = require("../Model/User");

function generatePassword() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  let password = "";

  for (let i = 0; i < 10; i++) {
    password += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  return password;
}

router.post("/", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    const existing = await PasswordReset.findOne({ email });

    if (existing?.lastResetAt) {
      const diff =
        Date.now() -
        new Date(existing.lastResetAt).getTime();

      const hours =
        diff / (1000 * 60 * 60);

      if (hours < 24) {
        return res.json({
          success: false,
          message:
            "You can reset password only once per day",
        });
      }
    }

    const generatedPassword =
      generatePassword();

    const hashedPassword =
      await bcrypt.hash(
        generatedPassword,
        10
      );

    await User.findOneAndUpdate(
      {
        email:
          email.toLowerCase().trim(),
      },
      {
        password:
          hashedPassword,
      }
    );

    const response =
      await fetch(
        "https://api.brevo.com/v3/smtp/email",
        {
          method: "POST",
          headers: {
            accept:
              "application/json",
            "content-type":
              "application/json",
            "api-key":
              process.env.BREVO_API_KEY,
          },
          body: JSON.stringify({
           sender: {
  name: "Intern Area",
  email: process.env.FROM_EMAIL,
},

            to: [
              {
                email,
              },
            ],

            subject:
              "Password Recovery",

            htmlContent: `
              <h2>Password Recovery</h2>

              <p>Your new password:</p>

              <h1>${generatedPassword}</h1>

              <p>Please login and change it immediately.</p>
            `,
          }),
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      console.log(
        "BREVO ERROR:",
        data
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to send email",
      });
    }

    await PasswordReset.findOneAndUpdate(
      { email },
      {
        lastResetAt:
          new Date(),
      },
      {
        upsert: true,
      }
    );

    console.log(
      "PASSWORD EMAIL SENT:",
      email
    );

    return res.json({
      success: true,
      message:
        "Password sent successfully",
    });

  } catch (err) {

    console.log(
      "FORGOT PASSWORD ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message,
    });
  }
});

module.exports = router;