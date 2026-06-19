const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  plan: {
    type: String,
    enum: ["bronze", "silver", "gold"],
    required: true,
  },
  amount:    { type: Number, required: true },
  paymentId: { type: String, required: true },
  orderId:   { type: String, required: true },
  startDate: { type: Date, default: Date.now },
  expiryDate:{ type: Date, required: true },
});

module.exports = mongoose.model("Subscription", SubscriptionSchema);