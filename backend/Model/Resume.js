const mongoose = require("mongoose");

const ResumeSchema = new mongoose.Schema({
  uid:           { type: String, required: true, unique: true }, // Firebase UID
  name:          { type: String, required: true },
  email:         { type: String, required: true },
  phone:         { type: String, default: "" },
  address:       { type: String, default: "" },
  qualification: { type: String, required: true },
  experience:    { type: String, default: "" },
  skills:        { type: String, default: "" },
  photo:         { type: String, default: "" }, // /uploads/<filename>
  resumePdf:     { type: String, default: "" },
  paymentStatus: { type: Boolean, default: false },
  razorpayOrderId:   { type: String, default: "" },
  razorpayPaymentId: { type: String, default: "" },
  createdAt:  { type: Date, default: Date.now },
  updatedAt:  { type: Date, default: Date.now },
});

ResumeSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Resume", ResumeSchema);