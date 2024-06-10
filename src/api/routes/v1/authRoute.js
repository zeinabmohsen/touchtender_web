const express = require("express");
const router = express.Router();
const {signUp,login,login2, uploadImage,logout ,getUserById ,updateUserById,
    forgotPassword,verifyResetCode,resetPassword,loginWeb
} = require("../../controllers/authController");

router.post("/signup",uploadImage,  signUp);
router.post("/login",  login2);
router.post("/loginweb",loginWeb)
router.post('/logout', logout);
router.get("/user/:id",getUserById);
router.put("/user/:id",updateUserById)
router.post('/forgotPassword', forgotPassword);
router.post('/verifyResetCode', verifyResetCode);
router.post('/resetPassword', resetPassword);

module.exports = router;