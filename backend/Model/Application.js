const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  company: String,

  category: String,

  coverLetter: String,

  availability: String,

  Application: Object,
  
resumeId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Resume",
},

  status: {
    type: String,
    enum: ["accepted", "pending", "rejected"],
    default: "pending",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model(
  "Application",
  ApplicationSchema
);