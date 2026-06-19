const User = require("../Model/User");

module.exports = async (req, res, next) => {
  try {

    const user = await User.findById(
      req.user.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    user.resetMonthlyCountIfNeeded();

    const limits = {
      free: 1,
      bronze: 3,
      silver: 5,
      gold: Infinity
    };

    const limit =
      limits[user.plan];

    if (
      user.monthlyApplicationCount >=
      limit
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Application limit reached. Upgrade your plan."
      });
    }

    req.currentUser = user;

    next();

  } catch (err) {

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};