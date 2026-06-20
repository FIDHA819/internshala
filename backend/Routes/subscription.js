const express      = require("express");
const router       = express.Router();
const crypto       = require("crypto");
const Razorpay     = require("razorpay");
const nodemailer   = require("nodemailer");
const User         = require("../Model/User");
const Subscription = require("../Model/Subscription");
const verifyToken  = require("../Middleware/verifyToken");

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Plan config
const PLANS = {
  bronze: { price: 100,  label: "Bronze Plan", applications: 3  },
  silver: { price: 300,  label: "Silver Plan", applications: 5  },
  gold:   { price: 1000, label: "Gold Plan",   applications: "Unlimited" },
};

// ─── Helper: is current IST time within 10:00–11:00 AM? ──────────────────────
function isPaymentWindowOpen() {
  // const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  // const istHour = new Date(Date.now() + IST_OFFSET_MS).getUTCHours();
  // return istHour >= 10 && istHour < 11;
    return true;
}

// ─── Helper: send invoice email after successful payment ─────────────────────
async function sendInvoiceEmail(email, plan, amount, paymentId, expiryDate) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASSWORD },
  });

  const planInfo = PLANS[plan];
  const formattedDate = new Date(expiryDate).toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });

  await transporter.sendMail({
    from:    process.env.EMAIL,
    to:      email,
    subject: `Intern Area — ${planInfo.label} Subscription Confirmed`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
        <div style="background:#2563eb;padding:24px;color:#fff">
          <h2 style="margin:0">Subscription Activated ✅</h2>
          <p style="margin:6px 0 0;opacity:.85">Thank you for subscribing to Intern Area</p>
        </div>
        <div style="padding:24px">
          <h3 style="margin-top:0">Invoice Summary</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr style="border-bottom:1px solid #f3f4f6">
              <td style="padding:10px 0;color:#6b7280">Plan</td>
              <td style="padding:10px 0;font-weight:600;text-align:right">${planInfo.label}</td>
            </tr>
            <tr style="border-bottom:1px solid #f3f4f6">
              <td style="padding:10px 0;color:#6b7280">Applications / month</td>
              <td style="padding:10px 0;font-weight:600;text-align:right">${planInfo.applications}</td>
            </tr>
            <tr style="border-bottom:1px solid #f3f4f6">
              <td style="padding:10px 0;color:#6b7280">Amount Paid</td>
              <td style="padding:10px 0;font-weight:600;text-align:right">₹${amount}</td>
            </tr>
            <tr style="border-bottom:1px solid #f3f4f6">
              <td style="padding:10px 0;color:#6b7280">Payment ID</td>
              <td style="padding:10px 0;font-size:12px;text-align:right;color:#6b7280">${paymentId}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#6b7280">Valid Until</td>
              <td style="padding:10px 0;font-weight:600;text-align:right">${formattedDate}</td>
            </tr>
          </table>
          <p style="margin-top:24px;font-size:13px;color:#6b7280">
            Your plan is active for 30 days. Visit your profile to track your application usage.
          </p>
        </div>
      </div>
    `,
  });
}

// ─── CREATE RAZORPAY ORDER ────────────────────────────────────────────────────
// POST /subscription/create-order
router.post("/create-order", verifyToken, async (req, res) => {
  try {
    if (!isPaymentWindowOpen()) {
      return res.status(403).json({
        success: false,
        message: "Payments are only accepted between 10:00 AM and 11:00 AM IST.",
      });
    }

    const { plan } = req.body;
    if (!PLANS[plan]) {
      return res.status(400).json({ success: false, message: "Invalid plan selected." });
    }

  const receipt = `sub_${Date.now()}`;

const order = await razorpay.orders.create({
  amount: PLANS[plan].price * 100,
  currency: "INR",
  receipt,
});
    return res.json({ success: true, order, plan, amount: PLANS[plan].price });
  } catch (err) {
    console.error("Create order error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── VERIFY PAYMENT & ACTIVATE PLAN ──────────────────────────────────────────
// POST /subscription/verify-payment
router.post("/verify-payment", verifyToken, async (req, res) => {
  try {
    const {
      plan,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!PLANS[plan])
      return res.status(400).json({ success: false, message: "Invalid plan." });

    // HMAC signature verification
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    // Activate plan on user
    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    user.plan                    = plan;
    user.planExpiresAt           = expiryDate;
    user.monthlyApplicationCount = 0;  // reset counter on new plan
    user.applicationCountResetAt = new Date();
    await user.save();

    // Save subscription record
    await Subscription.create({
      userId:    user._id,
      plan,
      amount:    PLANS[plan].price,
      paymentId: razorpay_payment_id,
      orderId:   razorpay_order_id,
      expiryDate,
    });

    // Send invoice email
    await sendInvoiceEmail(user.email, plan, PLANS[plan].price, razorpay_payment_id, expiryDate);

    return res.json({
      success: true,
      message: `${PLANS[plan].label} activated! Invoice sent to your email.`,
      plan,
      planExpiresAt: expiryDate,
    });
  } catch (err) {
    console.error("Verify payment error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET CURRENT SUBSCRIPTION INFO ───────────────────────────────────────────
router.get("/my-plan", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("plan planExpiresAt monthlyApplicationCount");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const limit = user.applicationLimit();
    console.log("Current User Plan:", user.plan);
    return res.json({
      success: true,
      plan:    user.plan,
      planExpiresAt: user.planExpiresAt,
      monthlyApplicationCount: user.monthlyApplicationCount,
      applicationLimit: limit === Infinity ? "Unlimited" : limit,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;