const express = require("express");
const router = express.Router();
const {signUp,login,login2} = require("../../controllers/authController");

router.post("/signup",  signUp);
router.post("/login",  login2);

module.exports = router;