const express    = require("express");
const router     = express.Router();
const crypto     = require("crypto");
const Razorpay   = require("razorpay");
const Resume     = require("../Model/Resume");
const upload     = require("../multer");
const verifyToken = require("../Middleware/verifyToken");

require("dotenv").config();

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error("WARNING: Razorpay credentials missing from environment.");
}

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID     || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

// ─── CREATE ORDER (₹50) ───────────────────────────────────────────────────────
router.post("/create-order", verifyToken, async (req, res) => {
  try {
    const order = await razorpay.orders.create({
      amount:   50 * 100, // ₹50 in paise
      currency: "INR",
      receipt:  `resume_${Date.now()}`,
    });
    return res.json({ success: true, order });
  } catch (err) {
    console.error("Resume order error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── VERIFY PAYMENT & SAVE RESUME ────────────────────────────────────────────
router.post("/verify-and-save", verifyToken, upload.single("photo"), async (req, res) => {
  try {
    const {
      uid, name, email, phone, address,
      qualification, experience, skills,
      razorpay_payment_id, razorpay_order_id, razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment details missing." });
    }
    if (!uid || !name || !email || !qualification) {
      return res.status(400).json({ success: false, message: "Required fields missing." });
    }

    // HMAC signature check
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed." });
    }

    const photo = req.file ? `/uploads/${req.file.filename}` : "";

    const updatedResume = await Resume.findOneAndUpdate(
      { uid },
      {
        uid, name, email, phone, address,
        qualification, experience, skills, photo,
        paymentStatus:     true,
        razorpayOrderId:   razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      },
      { new: true, upsert: true }
    );

    return res.json({ success: true, data: updatedResume });
  } catch (err) {
    console.error("Resume save error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── FETCH RESUME BY UID ──────────────────────────────────────────────────────
router.get("/:uid", verifyToken, async (req, res) => {
  try {
    const resume = await Resume.findOne({ uid: req.params.uid });
    if (!resume) return res.status(404).json({ success: false, message: "No resume found." });
    return res.json({ success: true, resume });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;