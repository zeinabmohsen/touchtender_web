const express = require("express");
const router = express.Router();
const {signUp,login,login2, uploadImage,logout ,getUserById ,updateUserById} = require("../../controllers/authController");

router.post("/signup",uploadImage,  signUp);
router.post("/login",  login2);
router.post('/logout', logout);
router.get("/user/:id",getUserById);
router.put("/user/:id",updateUserById)

module.exports = router;