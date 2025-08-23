const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// User routes
router.get('/jwt-current', authMiddleware, userController.getCurrentUser);
router.get('/profile/:id', authMiddleware, userController.getUserById);
router.put('/profile/:id', authMiddleware, userController.updateUser);
router.get('/all', authMiddleware, userController.getAllUser);
router.post('/upload-avatar/:id', authMiddleware, userController.uploadAvatarMiddleware, userController.uploadAvatar);

module.exports = router;
