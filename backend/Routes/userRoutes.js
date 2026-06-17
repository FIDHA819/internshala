const express = require("express");
const router = express.Router();
const User = require("../Model/User");
const verifyToken = require("../Middleware/verifyToken");

// 1. SEND A FRIEND REQUEST
router.post("/friend-request/send/:id", verifyToken, async (req, res) => {
  try {
    const sender = await User.findById(req.user.id);
    const receiver = await User.findById(req.params.id);

    if (!receiver) return res.status(404).json({ success: false, message: "User not found" });
    if (sender.friends.includes(receiver._id)) return res.status(400).json({ success: false, message: "Already friends" });

    if (!receiver.friendRequestsReceived.includes(sender._id)) {
      receiver.friendRequestsReceived.push(sender._id);
      sender.friendRequestsSent.push(receiver._id);
      await receiver.save();
      await sender.save();
    }

    res.json({ success: true, message: "Friend request sent!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. ACCEPT A FRIEND REQUEST
router.post("/friend-request/accept/:id", verifyToken, async (req, res) => {
  try {
    const receiver = await User.findById(req.user.id); 
    const sender = await User.findById(req.params.id);   

    if (!sender) return res.status(404).json({ success: false, message: "Sender not found" });

    // Remove from pending structures
    receiver.friendRequestsReceived = receiver.friendRequestsReceived.filter(id => id.toString() !== sender._id.toString());
    sender.friendRequestsSent = sender.friendRequestsSent.filter(id => id.toString() !== receiver._id.toString());

    // Push into active friends array
    receiver.friends.push(sender._id);
    sender.friends.push(receiver._id);

    await receiver.save();
    await sender.save();

    res.json({ success: true, message: "Friend request accepted!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. OPTIONAL: DIRECT ADD/REMOVE BYPASS ROUTE 
router.post("/friend/:targetUserId", verifyToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { targetUserId } = req.params;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ success: false, message: "You cannot add yourself." });
    }

    const user = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!user || !targetUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const isAlreadyFriend = user.friends.includes(targetUserId);

    if (isAlreadyFriend) {
      user.friends = user.friends.filter(id => id.toString() !== targetUserId);
      targetUser.friends = targetUser.friends.filter(id => id.toString() !== currentUserId);
      await user.save();
      await targetUser.save();
      return res.status(200).json({ success: true, message: "Friend removed.", isFriend: false });
    } else {
      user.friends.push(targetUserId);
      targetUser.friends.push(currentUserId);
      await user.save();
      await targetUser.save();
      return res.status(200).json({ success: true, message: "Friend added!", isFriend: true });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
// --- GET ALL USERS FOR DISCOVERY ---
router.get("/discover", verifyToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const currentUser = await User.findById(currentUserId);

    const users = await User.find({
      _id: {
        $nin: [
          currentUserId,
          ...currentUser.friends
        ]
      }
    }).select(
      "email photo friends friendRequestsReceived friendRequestsSent"
    );

    res.json({
      success: true,
      users
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});
router.get("/friend-requests", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("friendRequestsReceived", "email photo")
      .populate("friends", "email photo");

    res.json({
      success: true,
      requests: user.friendRequestsReceived,
      friends: user.friends,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      user
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});
module.exports = router;