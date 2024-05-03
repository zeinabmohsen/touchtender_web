const express = require("express");
const router = express.Router();
const {signUp,login,login2, logout} = require("../../controllers/authController");

router.post("/signup",  signUp);
router.post("/login",  login2);
router.get('/logout', logout);

module.exports = router;