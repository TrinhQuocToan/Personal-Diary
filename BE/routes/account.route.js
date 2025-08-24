const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const accountController = require("../controllers/account.controller")

//Athorization
router.post("/register", accountController.registerAccount);
router.post("/login", accountController.loginAccount);
router.post("/logout", [authMiddleware], accountController.logOutAccount);
router.post("/forgot-password", accountController.forgotPassword);
router.put("/change-password", [authMiddleware], accountController.changePassword);
router.post("/verify-otp", accountController.verifyOTP)
router.put("/reset-password", accountController.resetPassword)
router.post("/refresh-token", accountController.refreshToken);

module.exports = router;