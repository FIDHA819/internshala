const express = require("express");
const router = express.Router();
const adminuser = "admin";
const adminpass = "admin";

router.post("/adminlogin", (req, res) => {
  const { username, password } = req.body;
  if (username === adminuser && password === adminpass) {
    res.send("admin is here");
  } else {
    res.status(401).json({
 message: "Invalid credentials"
});
  }
});
module.exports = router;