const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Resume = require("../Model/Resume");
const upload = require("../multer");

// Initialize environment parsing explicitly at runtime entry
require("dotenv").config();

// Ensure instance safety checks throw useful alerts if keys are missing from environment profile
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error("CRITICAL WARNING: Razorpay credential sets missing from .env context configurations.");
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

// Step 1: Create a Razorpay Order (₹50)
router.post("/create-order", async (req, res) => {
  try {
    const options = {
      amount: 50 * 100, // 50 INR = 5000 Paise
      currency: "INR",
      receipt: `receipt_resume_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    return res.status(200).json({ success: true, order });
  } catch (err) {
    console.error("Razorpay Order Generation Error:", err);
    return res.status(500).json({ error: "Failed initialization of signature authorization order parameters." });
  }
});

// Step 2: Save or Update Resume after Payment Signature Verification
router.post(
  "/verify-and-save",
  upload.single("photo"),
  async (req, res) => {
    try {

      const {
        uid,
        name,
        email,
        phone,
        address,
        qualification,
        experience,
        skills,
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
      } = req.body;

      const photo = req.file
        ? `/uploads/${req.file.filename}`
        : "";

      if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
      ) {
        return res.status(400).json({
          success: false,
          message: "Payment details missing",
        });
      }

      if (!uid || !name || !email) {
        return res.status(400).json({
          success: false,
          message: "Required fields missing",
        });
      }

      const body =
        razorpay_order_id +
        "|" +
        razorpay_payment_id;

      const expectedSignature = crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(body)
        .digest("hex");

      const isAuthentic =
        expectedSignature ===
        razorpay_signature;

      if (!isAuthentic) {
        return res.status(400).json({
          success: false,
          message: "Payment verification failed",
        });
      }

      const updatedResume =
        await Resume.findOneAndUpdate(
          { uid },
          {
            uid,
            name,
            email,
            phone,
            address,
            qualification,
            experience,
            skills,
            photo,
            paymentStatus: true,
          },
          {
            new: true,
            upsert: true,
          }
        );

      return res.status(200).json({
        success: true,
        data: updatedResume,
      });

    } catch (err) {
      console.error(err);

      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

// Step 3: Fetch Active Resume by User UID
router.get("/:uid", async (req, res) => {
  try {
    const resume = await Resume.findOne({ uid: req.params.uid });
    
    if (!resume) {
      return res.status(404).json({ success: false, message: "No custom resume records found matching requested profile references." });
    }

    return res.status(200).json(resume);
  } catch (err) {
    console.error("Resume Read Error:", err);
    return res.status(500).json({ error: "Server Error parsing storage systems." });
  }
});

module.exports = router;