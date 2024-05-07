const express = require("express");
const router = express.Router();
const {signUp,login,login2, uploadImage,logout} = require("../../controllers/authController");

router.post("/signup",uploadImage,  signUp);
router.post("/login",  login2);
router.get('/logout', logout);

module.exports = router;