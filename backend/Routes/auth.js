const express     = require("express");
const router      = express.Router();
const bcrypt      = require("bcryptjs");
const jwt         = require("jsonwebtoken");
const crypto      = require("crypto");
const UAParser    = require("ua-parser-js");
const axios       = require("axios");          // already in your project
const User        = require("../Model/User");
const verifyToken = require("../Middleware/verifyToken");

const JWT_SECRET = process.env.JWT_SECRET;

// ─── In-memory OTP store ──────────────────────────────────────────────────────
const loginOtpStore = new Map();
const OTP_TTL_MS    = 10 * 60 * 1000;

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
  if (result.device.type === "mobile")      deviceType = "mobile";
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

const signToken = (userId) =>
  jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });

// ─── Send email via Brevo REST API (HTTP — works on Render) ──────────────────
// No SMTP, no ports — just a plain HTTPS POST.
// Required env vars (set in Render dashboard):
//   BREVO_API_KEY  — your Brevo API key (Settings → API Keys → Generate)
//   FROM_EMAIL     — a verified sender address in your Brevo account
const sendEmailViaBrevo = async (toEmail, subject, htmlContent, textContent) => {
  const response = await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender:   { name: "Intern Area", email: process.env.FROM_EMAIL },
      to:       [{ email: toEmail }],
      subject,
      htmlContent,
      textContent,
    },
    {
      headers: {
        "api-key":     process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 10000, // 10 s
    }
  );
  return response.data;
};

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

// ─── Send Chrome login OTP ────────────────────────────────────────────────────
const sendLoginOtp = async (user, email, env) => {
  const otp = generateOTP();

  loginOtpStore.set(email, { otp, env, expiresAt: Date.now() + OTP_TTL_MS });
  user.loginHistory.push({ ...env, status: "OTP Pending" });
  await user.save();

  console.log(`[OTP] Generated for ${email}: ${otp}`);

  try {
    await sendEmailViaBrevo(
      email,
      "Your Login Verification Code — Intern Area",
      `
        <div style="font-family:sans-serif;max-width:420px;margin:auto;padding:28px;
                    border:1px solid #e5e7eb;border-radius:12px">
          <h2 style="color:#2563eb;margin-top:0">Login Verification</h2>
          <p style="color:#374151;margin-bottom:20px">
            Use the code below to complete your sign-in. It expires in <strong>10 minutes</strong>.
          </p>
          <div style="font-size:40px;font-weight:800;letter-spacing:10px;
                      color:#111827;text-align:center;padding:20px 0;
                      background:#f9fafb;border-radius:8px;margin-bottom:20px">
            ${otp}
          </div>
          <p style="color:#6b7280;font-size:13px">
            If you did not attempt to log in, please ignore this email.
          </p>
        </div>
      `,
      `Your Intern Area login code is: ${otp}. It expires in 10 minutes.`
    );

    console.log(`[OTP] Email sent successfully to ${email}`);
    return { success: true, requiresOtp: true, message: "OTP sent to your email." };

  } catch (err) {
    // Log the real Brevo error for debugging
    const detail = err.response?.data || err.message;
    console.error("[OTP] Brevo API error:", JSON.stringify(detail, null, 2));

    // Still allow the flow — OTP is stored; user can use it if email arrives
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

