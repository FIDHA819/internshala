const express = require("express");
const router = express.Router();
const Post = require("../Model/Post");
const User = require("../Model/User");
const verifyToken = require("../Middleware/verifyToken"); // Assuming you use JWT middleware

// --- CREATE POST WITH FRIENDSHIP LIMITS ---
router.post("/create", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id; // Extracted from JWT verification middleware
    const { caption, mediaUrl, mediaType } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const friendCount = user.friends.length;
    
    // Determine Max Posting Allowance based on your rules
    let maxPostsAllowed = 0;
    if (friendCount === 0) {
      maxPostsAllowed = 0;
    } else if (friendCount > 10) {
      maxPostsAllowed = Infinity; // Unlimited
    } else {
      maxPostsAllowed = friendCount; // 1 friend = 1 post, 2 friends = 2 posts, etc.
    }

    // Check if 24 hours have passed since the last post to reset the counter
    const now = new Date();
    const limitsResetTime = new Date(user.lastPostAt);
    limitsResetTime.setHours(limitsResetTime.getHours() + 24);

    if (now > limitsResetTime) {
      user.dailyPostCount = 0; // Reset counter if 24h passed
    }

    // Enforce limits rule
    if (user.dailyPostCount >= maxPostsAllowed) {
      let errorMessage = "You have reached your daily posting limit.";
      if (friendCount === 0) {
        errorMessage = "Users with 0 friends cannot post to the Public Space. Build connections first!";
      } else if (friendCount <= 10) {
        errorMessage = `With ${friendCount} friends, you can only post ${friendCount} times per day. Expand your circle to unlock more!`;
      }
      return res.status(403).json({ success: false, message: errorMessage });
    }

    // Create the post if verification checks clear safely
    const newPost = new Post({
      user: userId,
      caption,
      mediaUrl,
      mediaType
    });
    await newPost.save();

    // Increment user post counter metrics records safely
    user.dailyPostCount += 1;
    user.lastPostAt = now;
    await user.save();

    return res.status(201).json({
      success: true,
      message: "Posted successfully to Public Space!",
      post: newPost
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// --- FETCH ALL PUBLIC SPACE POSTS ---
router.get("/all", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "email photo")
      .populate("comments.user", "email photo")
      .sort({ createdAt: -1 });
    return res.json({ success: true, posts });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error fetching posts." });
  }
});
// LIKE / UNLIKE POST
router.put("/:postId/like", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    const userId = req.user.id;

    const alreadyLiked = post.likes.some(
      id => id.toString() === userId
    );

    if (alreadyLiked) {
      post.likes = post.likes.filter(
        id => id.toString() !== userId
      );
    } else {
      post.likes.push(userId);
    }

    await post.save();

    res.json({
      success: true,
      likes: post.likes
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});
// ADD COMMENT
router.post("/:postId/comment", verifyToken, async (req, res) => {
  try {
    const { text } = req.body;

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    post.comments.push({
      user: req.user.id,
      text
    });

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate("comments.user", "email photo");

    res.json({
      success: true,
      comments: updatedPost.comments
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});
module.exports = router;