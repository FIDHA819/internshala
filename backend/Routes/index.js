const express      = require("express");
const router       = express.Router();

const admin        = require("./admin");
const intern       = require("./internship");
const job          = require("./job");
const application  = require("./application");
const otp          = require("./otp");
const resume       = require("./resume");
const passwordReset= require("./passwordReset");
const auth         = require("./auth");
const post         = require("./post");
const user         = require("./userRoutes");
const subscription = require("./subscription");

router.use("/admin",        admin);
router.use("/internship",   intern);
router.use("/job",          job);
router.use("/application",  application);
router.use("/password-reset", passwordReset);
router.use("/otp",          otp);
router.use("/resume",       resume);
router.use("/auth",         auth);
router.use("/posts",        post);
router.use("/users",        user);
router.use("/subscription", subscription);

module.exports = router;