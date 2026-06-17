const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  caption: {
    type: String,
    trim: true
  },
  mediaUrl: {
    type: String, // URL for photos/videos (Cloudinary, AWS S3, etc.)
    required: true
  },
  mediaType: {
    type: String,
    enum: ["image", "video"],
    required: true
  },
  likes: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
],

comments: [
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }
],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Post", PostSchema);