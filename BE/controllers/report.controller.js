const mongoose = require("mongoose");
const { Report } = require("../models/report.model");
const { Diary } = require("../models/note.model");
const { Comment } = require("../models/comment.model");

const reportController = {
    // Tạo báo cáo mới
    createReport: async (req, res) => {
        try {
            const { reportedItem, itemType, reason, description } = req.body;
            const reporterId = req.account.id;

            // Kiểm tra dữ liệu đầu vào
            if (!reportedItem || !itemType || !reason) {
                return res.status(400).json({ message: "Thiếu thông tin báo cáo" });
            }

            // Kiểm tra itemType hợp lệ
            if (!["post", "comment"].includes(itemType)) {
                return res.status(400).json({ message: "Loại báo cáo không hợp lệ" });
            }

            // Kiểm tra reason hợp lệ
            const validReasons = [
                "spam", "inappropriate", "harassment", "violence",
                "copyright", "fake_news", "other"
            ];
            if (!validReasons.includes(reason)) {
                return res.status(400).json({ message: "Lý do báo cáo không hợp lệ" });
            }

            // Kiểm tra xem item có tồn tại không
            let itemExists = false;
            if (itemType === "post") {
                itemExists = await Diary.findById(reportedItem);
            } else if (itemType === "comment") {
                itemExists = await Comment.findById(reportedItem);
            }

            if (!itemExists) {
                return res.status(404).json({ message: "Item báo cáo không tồn tại" });
            }

            // Kiểm tra xem user đã báo cáo item này chưa
            const existingReport = await Report.findOne({
                reporter: reporterId,
                reportedItem,
                itemType,
                status: { $in: ["pending", "reviewed"] }
            });

            if (existingReport) {
                return res.status(400).json({ message: "Bạn đã báo cáo item này rồi" });
            }

            // Tạo báo cáo mới
            const newReport = new Report({
                reporter: reporterId,
                reportedItem,
                itemType,
                reason,
                description: description || "",
                status: "pending"
            });

            await newReport.save();

            return res.status(201).json({
                message: "Báo cáo đã được gửi thành công",
                report: newReport
            });
        } catch (error) {
            console.error("Create report error:", error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    },

    // Lấy danh sách báo cáo (cho admin)
    getAllReports: async (req, res) => {
        try {
            const { page = 1, limit = 10, status = "", itemType = "", sortBy = "createdAt", sortOrder = "desc" } = req.query;

            // Xây dựng filter
            const filter = { isDeleted: { $ne: true } };

            if (status) {
                filter.status = status;
            }

            if (itemType) {
                filter.itemType = itemType;
            }

            // Xây dựng sort
            const sort = {};
            sort[sortBy] = sortOrder === "desc" ? -1 : 1;

            // Thực hiện query với phân trang
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const reports = await Report.find(filter)
                .populate("reporter", "fullName username email")
                .populate("resolvedBy", "fullName username")
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit));

            const totalReports = await Report.countDocuments(filter);

            return res.status(200).json({
                reports,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalReports / parseInt(limit)),
                    totalReports,
                    hasNext: skip + reports.length < totalReports,
                    hasPrev: parseInt(page) > 1
                }
            });
        } catch (error) {
            console.error("Get all reports error:", error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    },

    // Lấy thông tin chi tiết một báo cáo
    getReportById: async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "ID không hợp lệ" });
            }

            const report = await Report.findById(id)
                .populate("reporter", "fullName username email")
                .populate("resolvedBy", "fullName username");

            if (!report) {
                return res.status(404).json({ message: "Báo cáo không tồn tại" });
            }

            return res.status(200).json(report);
        } catch (error) {
            console.error("Get report by ID error:", error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    },

    // Cập nhật trạng thái báo cáo (cho admin)
    updateReportStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status, adminNotes } = req.body;
            const adminId = req.account.id;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "ID không hợp lệ" });
            }

            if (!["pending", "reviewed", "resolved", "dismissed"].includes(status)) {
                return res.status(400).json({ message: "Trạng thái không hợp lệ" });
            }

            const updateData = { status };

            if (adminNotes) {
                updateData.adminNotes = adminNotes;
            }

            if (status === "resolved" || status === "dismissed") {
                updateData.resolvedBy = adminId;
                updateData.resolvedAt = new Date();
            }

            const updatedReport = await Report.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).populate("reporter", "fullName username email");

            if (!updatedReport) {
                return res.status(404).json({ message: "Báo cáo không tồn tại" });
            }

            return res.status(200).json({
                message: "Cập nhật trạng thái báo cáo thành công",
                report: updatedReport
            });
        } catch (error) {
            console.error("Update report status error:", error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    },

    // Xóa báo cáo (soft delete)
    deleteReport: async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "ID không hợp lệ" });
            }

            const report = await Report.findById(id);
            if (!report) {
                return res.status(404).json({ message: "Báo cáo không tồn tại" });
            }

            // Soft delete
            report.isDeleted = true;
            report.deletedAt = new Date();
            await report.save();

            return res.status(200).json({ message: "Xóa báo cáo thành công" });
        } catch (error) {
            console.error("Delete report error:", error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    },

    // Khôi phục báo cáo đã bị xóa
    restoreReport: async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "ID không hợp lệ" });
            }

            const report = await Report.findById(id);
            if (!report) {
                return res.status(404).json({ message: "Báo cáo không tồn tại" });
            }

            if (!report.isDeleted) {
                return res.status(400).json({ message: "Báo cáo chưa bị xóa" });
            }

            report.isDeleted = false;
            report.deletedAt = null;
            await report.save();

            return res.status(200).json({ message: "Khôi phục báo cáo thành công" });
        } catch (error) {
            console.error("Restore report error:", error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    },

    // Thống kê báo cáo (cho admin dashboard)
    getReportStats: async (req, res) => {
        try {
            const totalReports = await Report.countDocuments({ isDeleted: { $ne: true } });
            const pendingReports = await Report.countDocuments({ isDeleted: { $ne: true }, status: "pending" });
            const resolvedReports = await Report.countDocuments({ isDeleted: { $ne: true }, status: "resolved" });
            const dismissedReports = await Report.countDocuments({ isDeleted: { $ne: true }, status: "dismissed" });

            // Thống kê theo loại item
            const itemTypeStats = await Report.aggregate([
                { $match: { isDeleted: { $ne: true } } },
                { $group: { _id: "$itemType", count: { $sum: 1 } } }
            ]);

            // Thống kê theo lý do
            const reasonStats = await Report.aggregate([
                { $match: { isDeleted: { $ne: true } } },
                { $group: { _id: "$reason", count: { $sum: 1 } } }
            ]);

            // Thống kê theo thời gian (7 ngày gần nhất)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const recentReports = await Report.countDocuments({
                createdAt: { $gte: sevenDaysAgo },
                isDeleted: { $ne: true }
            });

            return res.status(200).json({
                overview: {
                    totalReports,
                    pendingReports,
                    resolvedReports,
                    dismissedReports,
                    recentReports
                },
                itemTypeStats,
                reasonStats
            });
        } catch (error) {
            console.error("Get report stats error:", error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    }
};

module.exports = reportController;
