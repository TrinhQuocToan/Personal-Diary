const express = require('express');
const router = express.Router();
const accountController = require('../controllers/account.controller');

// Account/Auth routes
router.post('/register', accountController.registerAccount);
router.post('/login', accountController.loginAccount);
router.post('/logout', accountController.logOutAccount);
router.post('/refresh-token', accountController.refreshToken);
router.post('/forgot-password', accountController.forgotPassword);
router.post('/verify-otp', accountController.verifyOTP);
router.post('/reset-password', accountController.resetPassword);
router.post('/change-password', accountController.changePassword);

module.exports = router;
