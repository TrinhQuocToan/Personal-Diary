const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");

// ===== USER MANAGEMENT =====
router.get("/users", authMiddleware, adminMiddleware, adminController.getAllUsers);
router.get("/users/:id", authMiddleware, adminMiddleware, adminController.getUserById);
router.put("/users/:id", authMiddleware, adminMiddleware, adminController.updateUser);
router.delete("/users/:id", authMiddleware, adminMiddleware, adminController.deleteUser);
router.patch("/users/:id/restore", authMiddleware, adminMiddleware, adminController.restoreUser);
router.patch("/users/:id/role", authMiddleware, adminMiddleware, adminController.changeUserRole);

// ===== POST MANAGEMENT =====
router.get("/posts", authMiddleware, adminMiddleware, adminController.getAllPosts);
router.get("/posts/:id", authMiddleware, adminMiddleware, adminController.getPostById);
router.put("/posts/:id", authMiddleware, adminMiddleware, adminController.updatePost);
router.delete("/posts/:id", authMiddleware, adminMiddleware, adminController.deletePost);
router.patch("/posts/:id/restore", authMiddleware, adminMiddleware, adminController.restorePost);

// ===== COMMENT MANAGEMENT =====
router.delete("/comments/:id", authMiddleware, adminMiddleware, adminController.deleteComment);
router.patch("/comments/:id/restore", authMiddleware, adminMiddleware, adminController.restoreComment);

// ===== DASHBOARD STATS =====
router.get("/dashboard/stats", authMiddleware, adminMiddleware, adminController.getDashboardStats);

module.exports = router;
