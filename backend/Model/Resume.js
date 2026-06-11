const mongoose = require("mongoose");

const ResumeSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true, // Guarantees a student has exactly one active resume attached
  },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  address: String,
  qualification: { type: String, required: true },
  experience: String,
  skills: String,
  photo: String, // Base64 encoding payload string
  resumePdf: String,
  paymentStatus: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Resume", ResumeSchema);