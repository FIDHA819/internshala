const express = require("express");
const router = express.Router();

const verifyToken = require("../Middleware/verifyToken");
const checkApplicationLimit = require("../Middleware/checkApplicationLimit");
const Application = require("../Model/Application");
const User = require("../Model/User");

router.post(
  "/",
  verifyToken,
  checkApplicationLimit,
  async (req, res) => {
    try {
      const userId = req.user.id;

      if (!req.body.Application?._id) {
        return res.status(400).json({
          success: false,
          message: "Internship ID missing",
        });
      }

      const existingApplication =
        await Application.findOne({
          userId,
          "Application._id": req.body.Application._id,
        });

      if (existingApplication) {
        return res.status(400).json({
          success: false,
          message:
            "You already applied for this internship",
        });
      }

   const user = await User.findById(userId);

const applicationData = new Application({
  userId,
  company: req.body.company,
  category: req.body.category,
  coverLetter: req.body.coverLetter,
  availability: req.body.availability,
  Application: req.body.Application,

  resumeId: user.resumeId || "",
});

      await applicationData.save();

      

user.monthlyApplicationCount += 1;

await user.save();

      return res.status(201).json({
        success: true,
        message:
          "Application submitted successfully",
      });

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);
router.get("/check/:internshipId", verifyToken, async (req, res) => {
  try {
    const application = await Application.findOne({
      userId: req.user.id,
      "Application._id": req.params.internshipId,
    });

    return res.json({
      applied: !!application,
    });
  } catch (error) {
    return res.status(500).json({
      applied: false,
    });
  }
});
router.get(
  "/my",
  verifyToken,
  async (req, res) => {
    try {
    const applications =
  await Application.find({
    userId: req.user.id,
  })
    .populate("userId")
    .sort({
      createdAt: -1,
    });
      return res.json({
        success: true,
        applications,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);
module.exports = router;