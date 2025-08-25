const express = require("express");
const router = express.Router();
const reportController = require("../controllers/report.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");

// Routes cho user thường
router.post("/", authMiddleware, reportController.createReport);

// Routes cho admin (cần quyền admin)
router.get("/admin", authMiddleware, adminMiddleware, reportController.getAllReports);
router.get("/admin/:id", authMiddleware, adminMiddleware, reportController.getReportById);
router.put("/admin/:id/status", authMiddleware, adminMiddleware, reportController.updateReportStatus);
router.delete("/admin/:id", authMiddleware, adminMiddleware, reportController.deleteReport);
router.patch("/admin/:id/restore", authMiddleware, adminMiddleware, reportController.restoreReport);
router.get("/admin/stats", authMiddleware, adminMiddleware, reportController.getReportStats);
router.post("/admin/:id/remove", authMiddleware, adminMiddleware, reportController.removeItemFromCommunity);

module.exports = router;
