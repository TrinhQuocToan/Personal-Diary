const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// User routes
router.get("/jwt-current", authMiddleware, userController.getCurrentUser);
router.get("/profile/:id", authMiddleware, userController.getUserById);
router.put("/profile/:id", authMiddleware, userController.updateUser);
// Add the missing route that frontend is calling
router.put("/:id", authMiddleware, userController.updateUser);

// Avatar upload routes - support both endpoints
router.post(
  "/upload-avatar/:id",
  authMiddleware,
  userController.uploadAvatarMiddleware,
  userController.uploadAvatar
);
router.post(
  "/:id/avatar",
  authMiddleware,
  userController.uploadAvatarMiddleware,
  userController.uploadAvatar
);

// Security routes
router.post("/change-password", authMiddleware, userController.changePassword);
router.post("/change-email", authMiddleware, userController.changeEmail);

// Admin routes
router.get("/all", authMiddleware, userController.getAllUser);

module.exports = router;
