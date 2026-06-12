// Model/PasswordReset.js

const mongoose = require("mongoose");

const PasswordResetSchema =
new mongoose.Schema({
  email: String,

  generatedPassword: String,

  lastResetAt: Date,
});

module.exports =
mongoose.model(
  "PasswordReset",
  PasswordResetSchema
);