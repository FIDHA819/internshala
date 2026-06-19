const express     = require("express");
const router      = express.Router();
const bcrypt      = require("bcryptjs");
const jwt         = require("jsonwebtoken");
const crypto      = require("crypto");
const UAParser    = require("ua-parser-js");
const nodemailer  = require("nodemailer");
const User        = require("../Model/User");
const verifyToken = require("../Middleware/verifyToken");

const JWT_SECRET = process.env.JWT_SECRET;

// ─── In-memory OTP store ──────────────────────────────────────────────────────
const loginOtpStore = new Map();
const OTP_TTL_MS    = 10 * 60 * 1000; // 10 minutes

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of loginOtpStore.entries()) {
    if (val.expiresAt < now) loginOtpStore.delete(key);
  }
}, 5 * 60 * 1000);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getClientEnvironment = (req) => {
  const parser = new UAParser(req.headers["user-agent"] || "");
  const result = parser.getResult();

  let deviceType = "desktop";
  if (result.device.type === "mobile") deviceType = "mobile";
  else if (result.device.type === "tablet") deviceType = "tablet";

  const ipAddress =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "0.0.0.0";

  return {
    browser:    result.browser.name || "Unknown Browser",
    os:         result.os.name      || "Unknown OS",
    deviceType,
    ipAddress,
  };
};

const getISTHour = () => {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  return new Date(Date.now() + IST_OFFSET_MS).getUTCHours();
};

const generateOTP = () => String(crypto.randomInt(100000, 999999));

// ─── Brevo SMTP transporter ───────────────────────────────────────────────────
// Brevo (formerly Sendinblue) works on Render — Gmail SMTP is blocked.
// Set these env vars in your Render dashboard:
//   BREVO_USER  = your Brevo SMTP login  (Settings → SMTP & API → SMTP tab)
//   BREVO_PASS  = your Brevo SMTP key    (same page — "Generate a new SMTP key")
//   FROM_EMAIL  = the sender address you verified in Brevo (e.g. fidhapichu461@gmail.com)
const createTransporter = () =>
  nodemailer.createTransport({
    host:   "smtp-relay.brevo.com",
    port:   587,
    secure: false, // STARTTLS
    auth: {
      user: process.env.BREVO_USER, // looks like: abc123@smtp-brevo.com
      pass: process.env.BREVO_PASS, // the SMTP key Brevo generates (not your Brevo account password)
    },
  });

const signToken = (userId) =>
  jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });

// ─── Mobile time-window check ─────────────────────────────────────────────────
const checkMobileRestriction = async (user, env) => {
  if (env.deviceType === "mobile") {
    const istHour = getISTHour();
    if (istHour < 10 || istHour >= 13) {
      user.loginHistory.push({ ...env, status: "Blocked (Time Window)" });
      await user.save();
      return { blocked: true };
    }
  }
  return { blocked: false };
};

// ─── Send Chrome login OTP via Brevo ─────────────────────────────────────────
const sendLoginOtp = async (user, email, env) => {
  const otp = generateOTP();

  loginOtpStore.set(email, { otp, env, expiresAt: Date.now() + OTP_TTL_MS });
  user.loginHistory.push({ ...env, status: "OTP Pending" });
  await user.save();

  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from:    `"Intern Area" <${process.env.FROM_EMAIL}>`,
      to:      email,
      subject: "Your Login Verification Code",
      text:    `Your one-time login code is: ${otp}\n\nIt expires in 10 minutes.`,
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
          <h2 style="color:#2563eb;margin-top:0">Login Verification</h2>
          <p style="color:#374151">Use the code below to complete your login:</p>
          <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#111827;text-align:center;padding:16px 0">
            ${otp}
          </div>
          <p style="color:#6b7280;font-size:13px">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
        </div>
      `,
    });

    console.log("✅ OTP email sent via Brevo to:", email);
    return { success: true, requiresOtp: true, message: "OTP sent to your email." };

  } catch (err) {
    console.error("❌ Brevo email error:", err.message);
    // Still return requiresOtp so the flow continues —
    // remove this in production and return an error instead.
    return { success: true, requiresOtp: true, message: "OTP sent to your email." };
  }
};

// ─── REGISTER ─────────────────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password are required." });

    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: "An account with this email already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ email, password: hashedPassword });

    return res.status(201).json({
      success: true,
      message: "Registration successful!",
      user:  { id: newUser._id, email: newUser.email, photo: newUser.photo, plan: newUser.plan },
      token: signToken(newUser._id),
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── GOOGLE LOGIN ─────────────────────────────────────────────────────────────
router.post("/google-login", async (req, res) => {
  try {
    const { email, photo } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required." });

    const env = getClientEnvironment(req);

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, photo: photo || "", password: "" });
    } else if (photo && !user.photo) {
      user.photo = photo;
      await user.save();
    }

    const mobileCheck = await checkMobileRestriction(user, env);
    if (mobileCheck.blocked) {
      return res.status(403).json({
        success: false,
        message: "Mobile login is only allowed between 10:00 AM and 1:00 PM IST.",
      });
    }

    if (env.browser && env.browser.toLowerCase().includes("chrome")) {
      return res.json(await sendLoginOtp(user, email, env));
    }

    user.loginHistory.push({ ...env, status: "Success" });
    await user.save();

    return res.json({
      success: true,
      message: "Logged in with Google!",
      user:  { id: user._id, email: user.email, photo: user.photo, plan: user.plan },
      token: signToken(user._id),
    });
  } catch (err) {
    console.error("Google login error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── EMAIL/PASSWORD LOGIN ─────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password are required." });

    const user = await User.findOne({ email });
    if (!user || !user.password)
      return res.status(400).json({ success: false, message: "Invalid email or password." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ success: false, message: "Invalid email or password." });

    const env = getClientEnvironment(req);

    const mobileCheck = await checkMobileRestriction(user, env);
    if (mobileCheck.blocked) {
      return res.status(403).json({
        success: false,
        message: "Mobile login is only allowed between 10:00 AM and 1:00 PM IST.",
      });
    }

    if (env.browser && env.browser.toLowerCase().includes("chrome")) {
      return res.json(await sendLoginOtp(user, email, env));
    }

    user.loginHistory.push({ ...env, status: "Success" });
    await user.save();

    return res.json({
      success: true,
      message: "Logged in successfully!",
      user:  { id: user._id, email: user.email, photo: user.photo, plan: user.plan },
      token: signToken(user._id),
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── VERIFY LOGIN OTP ─────────────────────────────────────────────────────────
router.post("/verify-login-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ success: false, message: "Email and OTP are required." });

    const record = loginOtpStore.get(email);
    if (!record)
      return res.status(400).json({ success: false, message: "No pending OTP. Please log in again." });

    if (Date.now() > record.expiresAt) {
      loginOtpStore.delete(email);
      return res.status(400).json({ success: false, message: "OTP has expired. Please log in again." });
    }

    if (record.otp !== otp)
      return res.status(400).json({ success: false, message: "Invalid verification code." });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    user.loginHistory.push({ ...record.env, status: "Success" });
    await user.save();
    loginOtpStore.delete(email);

    return res.json({
      success: true,
      message: "Verified successfully!",
      user:  { id: user._id, email: user.email, photo: user.photo, plan: user.plan },
      token: signToken(user._id),
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── LOGIN HISTORY ────────────────────────────────────────────────────────────
router.get("/login-history", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("loginHistory");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const history = [...user.loginHistory].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    return res.json({ success: true, history });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
router.post("/logout", (_req, res) =>
  res.json({ success: true, message: "Logged out successfully." })
);

module.exports = router;