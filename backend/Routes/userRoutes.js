const express     = require("express");
const router      = express.Router();
const User        = require("../Model/User");
const verifyToken = require("../Middleware/verifyToken");

// ─── GET CURRENT USER ─────────────────────────────────────────────────────────
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -loginHistory");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DISCOVER USERS (excludes self + existing friends) ────────────────────────
router.get("/discover", verifyToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).select("friends");
    if (!currentUser) return res.status(404).json({ success: false, message: "User not found." });

    const users = await User.find({
      _id: { $nin: [req.user.id, ...currentUser.friends] },
    }).select("email photo friends friendRequestsReceived friendRequestsSent");

    return res.json({ success: true, users });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET FRIEND REQUESTS + FRIENDS ───────────────────────────────────────────
router.get("/friend-requests", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("friendRequestsReceived", "email photo")
      .populate("friends", "email photo");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    return res.json({
      success:  true,
      requests: user.friendRequestsReceived,
      friends:  user.friends,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── SEND FRIEND REQUEST ──────────────────────────────────────────────────────
router.post("/friend-request/send/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.id === req.params.id)
      return res.status(400).json({ success: false, message: "You cannot send a request to yourself." });

    const [sender, receiver] = await Promise.all([
      User.findById(req.user.id),
      User.findById(req.params.id),
    ]);
    if (!receiver) return res.status(404).json({ success: false, message: "User not found." });

    if (sender.friends.some(id => id.equals(receiver._id)))
      return res.status(400).json({ success: false, message: "You are already friends." });

    if (sender.friendRequestsSent.some(id => id.equals(receiver._id)))
      return res.status(400).json({ success: false, message: "Friend request already sent." });

    receiver.friendRequestsReceived.push(sender._id);
    sender.friendRequestsSent.push(receiver._id);
    await Promise.all([receiver.save(), sender.save()]);

    return res.json({ success: true, message: "Friend request sent!" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ACCEPT FRIEND REQUEST ────────────────────────────────────────────────────
router.post("/friend-request/accept/:id", verifyToken, async (req, res) => {
  try {
    const [receiver, sender] = await Promise.all([
      User.findById(req.user.id),
      User.findById(req.params.id),
    ]);
    if (!sender)   return res.status(404).json({ success: false, message: "User not found." });
    if (!receiver) return res.status(404).json({ success: false, message: "Current user not found." });

    const requestExists = receiver.friendRequestsReceived.some(id => id.equals(sender._id));
    if (!requestExists)
      return res.status(400).json({ success: false, message: "No pending friend request from this user." });

    receiver.friendRequestsReceived = receiver.friendRequestsReceived.filter(id => !id.equals(sender._id));
    sender.friendRequestsSent       = sender.friendRequestsSent.filter(id => !id.equals(receiver._id));

    if (!receiver.friends.some(id => id.equals(sender._id))) receiver.friends.push(sender._id);
    if (!sender.friends.some(id => id.equals(receiver._id))) sender.friends.push(receiver._id);

    await Promise.all([receiver.save(), sender.save()]);
    return res.json({ success: true, message: "Friend request accepted!" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DECLINE FRIEND REQUEST ───────────────────────────────────────────────────
router.post("/friend-request/decline/:id", verifyToken, async (req, res) => {
  try {
    const [receiver, sender] = await Promise.all([
      User.findById(req.user.id),
      User.findById(req.params.id),
    ]);
    if (!sender) return res.status(404).json({ success: false, message: "User not found." });

    receiver.friendRequestsReceived = receiver.friendRequestsReceived.filter(id => !id.equals(sender._id));
    sender.friendRequestsSent       = sender.friendRequestsSent.filter(id => !id.equals(receiver._id));

    await Promise.all([receiver.save(), sender.save()]);
    return res.json({ success: true, message: "Friend request declined." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Alias: /reject → same as /decline (used by PublicSpace component)
router.post("/friend-request/reject/:id", verifyToken, async (req, res) => {
  req.params.id = req.params.id; // passthrough
  try {
    const [receiver, sender] = await Promise.all([
      User.findById(req.user.id),
      User.findById(req.params.id),
    ]);
    if (!sender) return res.status(404).json({ success: false, message: "User not found." });

    receiver.friendRequestsReceived = receiver.friendRequestsReceived.filter(id => !id.equals(sender._id));
    sender.friendRequestsSent       = sender.friendRequestsSent.filter(id => !id.equals(receiver._id));
    await Promise.all([receiver.save(), sender.save()]);
    return res.json({ success: true, message: "Friend request rejected." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── REMOVE FRIEND ────────────────────────────────────────────────────────────
router.delete("/friend/:targetUserId", verifyToken, async (req, res) => {
  try {
    const { targetUserId } = req.params;
    if (req.user.id === targetUserId)
      return res.status(400).json({ success: false, message: "Invalid operation." });

    const [user, targetUser] = await Promise.all([
      User.findById(req.user.id),
      User.findById(targetUserId),
    ]);
    if (!user || !targetUser)
      return res.status(404).json({ success: false, message: "User not found." });

    user.friends       = user.friends.filter(id => id.toString() !== targetUserId);
    targetUser.friends = targetUser.friends.filter(id => id.toString() !== req.user.id);

    await Promise.all([user.save(), targetUser.save()]);
    return res.json({ success: true, message: "Friend removed.", isFriend: false });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── TOGGLE FRIEND (backward-compat direct add/remove) ───────────────────────
router.post("/friend/:targetUserId", verifyToken, async (req, res) => {
  try {
    const { targetUserId } = req.params;
    if (req.user.id === targetUserId)
      return res.status(400).json({ success: false, message: "You cannot add yourself." });

    const [user, targetUser] = await Promise.all([
      User.findById(req.user.id),
      User.findById(targetUserId),
    ]);
    if (!user || !targetUser)
      return res.status(404).json({ success: false, message: "User not found." });

    const isAlreadyFriend = user.friends.some(id => id.toString() === targetUserId);

    if (isAlreadyFriend) {
      user.friends       = user.friends.filter(id => id.toString() !== targetUserId);
      targetUser.friends = targetUser.friends.filter(id => id.toString() !== req.user.id);
      await Promise.all([user.save(), targetUser.save()]);
      return res.json({ success: true, message: "Friend removed.", isFriend: false });
    } else {
      user.friends.push(targetUserId);
      targetUser.friends.push(req.user.id);
      await Promise.all([user.save(), targetUser.save()]);
      return res.json({ success: true, message: "Friend added!", isFriend: true });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
// GET PROFILE DASHBOARD
router.get("/profile-dashboard", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("friends", "email photo")
      .populate("friendRequestsReceived", "email photo");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      user: {
  _id: user._id,
  email: user.email,
  photo: user.photo,
  plan: user.plan,
  planExpiresAt: user.planExpiresAt,
  monthlyApplicationCount:
    user.monthlyApplicationCount,

  resumeId: user.resumeId,
  resumePdf: user.resumePdf,
},
      friends: user.friends,
      requests:
        user.friendRequestsReceived,
      stats: {
        friendsCount:
          user.friends.length,
        requestsCount:
          user.friendRequestsReceived
            .length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;