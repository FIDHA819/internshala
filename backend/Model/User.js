const mongoose = require("mongoose");

// ─── Login History Sub-document ───────────────────────────────────────────────
const LoginHistorySchema = new mongoose.Schema({
  browser:    { type: String, default: "Unknown Browser" },
  os:         { type: String, default: "Unknown OS" },
  deviceType: { type: String, default: "desktop" }, // desktop | mobile | tablet
  ipAddress:  { type: String, default: "0.0.0.0" },
  status: {
    type: String,
    enum: ["Success", "Blocked (Time Window)", "OTP Pending", "Failed"],
    default: "Failed",
  },
  timestamp: { type: Date, default: Date.now },
});

// ─── User Schema ──────────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    default: "", // Google users have no password
  },
  photo: {
    type: String,
    default: "",
  },
  resumeId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Resume",
  default: null,
},

resumePdf: {
  type: String,
  default: "",
},

  // ── Login auditing ──────────────────────────────────────────────────────────
  loginHistory: [LoginHistorySchema],

  // ── Friendship tracking ─────────────────────────────────────────────────────
  friends:                [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  friendRequestsSent:     [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  friendRequestsReceived: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // ── Subscription / plan ─────────────────────────────────────────────────────
  plan: {
    type: String,
    enum: ["free", "bronze", "silver", "gold"],
    default: "free",
  },
  planExpiresAt: { type: Date, default: null },

  // Monthly application counter (resets each calendar month)
  monthlyApplicationCount: { type: Number, default: 0 },
  applicationCountResetAt: { type: Date, default: Date.now },

  // ── Public-space rate limiting ───────────────────────────────────────────────
  dailyPostCount: { type: Number, default: 0 },
  lastPostAt:     { type: Date, default: Date.now },

  createdAt: { type: Date, default: Date.now },
});

// ─── Helper: max applications allowed per plan ────────────────────────────────
UserSchema.methods.applicationLimit = function () {
  const limits = { free: 1, bronze: 3, silver: 5, gold: Infinity };
  return limits[this.plan] ?? 1;
};

// ─── Helper: reset monthly counter when calendar month changes ────────────────
UserSchema.methods.resetMonthlyCountIfNeeded = function () {
  const now       = new Date();
  const lastReset = new Date(this.applicationCountResetAt);
  if (
    now.getFullYear() !== lastReset.getFullYear() ||
    now.getMonth()    !== lastReset.getMonth()
  ) {
    this.monthlyApplicationCount = 0;
    this.applicationCountResetAt = now;
  }
};

module.exports = mongoose.model("User", UserSchema);