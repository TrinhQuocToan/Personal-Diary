const mongoose = require("mongoose");
const User = require("../models/user.model");
const { Diary } = require("../models/note.model");

const adminController = {
    // ===== QUẢN LÝ USER =====

    // Lấy danh sách tất cả user (có phân trang và tìm kiếm)
    getAllUsers: async (req, res) => {
        try {
            const { page = 1, limit = 10, search = "", role = "", sortBy = "createdAt", sortOrder = "desc" } = req.query;

            // Xây dựng filter
            const filter = {};
            if (search) {
                filter.$or = [
                    { fullName: { $regex: search, $options: "i" } },
                    { username: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } }
                ];
            }
            if (role) {
                filter.role = role;
            }

            // Xây dựng sort
            const sort = {};
            sort[sortBy] = sortOrder === "desc" ? -1 : 1;

            // Thực hiện query với phân trang
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const users = await User.find(filter)
                .select("-password -otp -otpExpiration")
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit));

            const totalUsers = await User.countDocuments(filter);

            return res.status(200).json({
                users,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalUsers / parseInt(limit)),
                    totalUsers,
                    hasNext: skip + users.length < totalUsers,
                    hasPrev: parseInt(page) > 1
                }
            });
        } catch (error) {
            console.error("Get all users error:", error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    },

    // Lấy thông tin chi tiết một user
    getUserById: async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "ID không hợp lệ" });
            }

            const user = await User.findById(id).select("-password -otp -otpExpiration");
            if (!user) {
                return res.status(404).json({ message: "User không tồn tại" });
            }

            return res.status(200).json(user);
        } catch (error) {
            console.error("Get user by ID error:", error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    },

    // Cập nhật thông tin user (Admin có thể cập nhật tất cả trường)
    updateUser: async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = req.body;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "ID không hợp lệ" });
            }

            // Loại bỏ các trường không được phép cập nhật
            delete updateData.password;
            delete updateData.otp;
            delete updateData.otpExpiration;

            const updatedUser = await User.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).select("-password -otp -otpExpiration");

            if (!updatedUser) {
                return res.status(404).json({ message: "User không tồn tại" });
            }

            return res.status(200).json({
                message: "Cập nhật user thành công",
                user: updatedUser
            });
        } catch (error) {
            console.error("Update user error:", error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    },

    // Xóa user (soft delete)
    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "ID không hợp lệ" });
            }

            // Kiểm tra xem có phải admin đang xóa chính mình không
            if (id === req.adminUser._id.toString()) {
                return res.status(400).json({ message: "Không thể xóa chính mình" });
            }

            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ message: "User không tồn tại" });
            }

            // Soft delete - đánh dấu là đã xóa
            user.isDeleted = true;
            user.deletedAt = new Date();
            await user.save();

            return res.status(200).json({ message: "Xóa user thành công" });
        } catch (error) {
            console.error("Delete user error:", error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    },

    // Khôi phục user đã bị xóa
    restoreUser: async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "ID không hợp lệ" });
            }

            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ message: "User không tồn tại" });
            }

            if (!user.isDeleted) {
                return res.status(400).json({ message: "User chưa bị xóa" });
            }

            user.isDeleted = false;
            user.deletedAt = null;
            await user.save();

            return res.status(200).json({ message: "Khôi phục user thành công" });
        } catch (error) {
            console.error("Restore user error:", error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    },

    // Thay đổi role của user
    changeUserRole: async (req, res) => {
        try {
            const { id } = req.params;
            const { role } = req.body;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "ID không hợp lệ" });
            }

            if (!["user", "admin", "moderator"].includes(role)) {
                return res.status(400).json({ message: "Role không hợp lệ" });
            }

            // Kiểm tra xem có phải admin đang thay đổi role của chính mình không
            if (id === req.adminUser._id.toString()) {
                return res.status(400).json({ message: "Không thể thay đổi role của chính mình" });
            }

            const user = await User.findByIdAndUpdate(
                id,
                { role },
                { new: true, runValidators: true }
            ).select("-password -otp -otpExpiration");

            if (!user) {
                return res.status(404).json({ message: "User không tồn tại" });
            }

            return res.status(200).json({
                message: "Thay đổi role thành công",
                user
            });
        } catch (error) {
            console.error("Change user role error:", error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    },

    // ===== QUẢN LÝ BÀI VIẾT =====

    // Lấy danh sách tất cả bài viết (có phân trang và tìm kiếm)
    getAllPosts: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                search = "",
                mood = "",
                isPublic = "",
                userId = "",
                sortBy = "createdAt",
                sortOrder = "desc"
            } = req.query;

            // Xây dựng filter
            const filter = { isDeleted: { $ne: true } };

            if (search) {
                filter.$or = [
                    { title: { $regex: search, $options: "i" } },
                    { content: { $regex: search, $options: "i" } }
                ];
            }

            if (mood) {
                filter.mood = mood;
            }

            if (isPublic !== "") {
                filter.isPublic = isPublic === "true";
            }

            if (userId) {
                if (!mongoose.Types.ObjectId.isValid(userId)) {
                    return res.status(400).json({ message: "User ID không hợp lệ" });
                }
                filter.userId = userId;
            }

            // Xây dựng sort
            const sort = {};
            sort[sortBy] = sortOrder === "desc" ? -1 : 1;

            // Thực hiện query với phân trang
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const posts = await Diary.find(filter)
                .populate("userId", "fullName username email avatar")
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit));

            const totalPosts = await Diary.countDocuments(filter);

            return res.status(200).json({
                posts,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalPosts / parseInt(limit)),
                    totalPosts,
                    hasNext: skip + posts.length < totalPosts,
                    hasPrev: parseInt(page) > 1
                }
            });
        } catch (error) {
            console.error("Get all posts error:", error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    },

    // Lấy thông tin chi tiết một bài viết
    getPostById: async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "ID không hợp lệ" });
            }

            const post = await Diary.findById(id)
                .populate("userId", "fullName username email avatar")
                .populate("allowedViewers", "fullName username email avatar");

            if (!post) {
                return res.status(404).json({ message: "Bài viết không tồn tại" });
            }

            return res.status(200).json(post);
        } catch (error) {
            console.error("Get post by ID error:", error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    },

    // Cập nhật bài viết
    updatePost: async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = req.body;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "ID không hợp lệ" });
            }

            const post = await Diary.findById(id);
            if (!post) {
                return res.status(404).json({ message: "Bài viết không tồn tại" });
            }

            // Admin có thể cập nhật tất cả trường
            const updatedPost = await Diary.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).populate("userId", "fullName username email avatar");

            return res.status(200).json({
                message: "Cập nhật bài viết thành công",
                post: updatedPost
            });
        } catch (error) {
            console.error("Update post error:", error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    },

    // Xóa bài viết (soft delete)
    deletePost: async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "ID không hợp lệ" });
            }

            const post = await Diary.findById(id);
            if (!post) {
                return res.status(404).json({ message: "Bài viết không tồn tại" });
            }

            // Soft delete
            post.isDeleted = true;
            post.deletedAt = new Date();
            await post.save();

            return res.status(200).json({ message: "Xóa bài viết thành công" });
        } catch (error) {
            console.error("Delete post error:", error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    },

    // Khôi phục bài viết đã bị xóa
    restorePost: async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "ID không hợp lệ" });
            }

            const post = await Diary.findById(id);
            if (!post) {
                return res.status(404).json({ message: "Bài viết không tồn tại" });
            }

            if (!post.isDeleted) {
                return res.status(400).json({ message: "Bài viết chưa bị xóa" });
            }

            post.isDeleted = false;
            post.deletedAt = null;
            await post.save();

            return res.status(200).json({ message: "Khôi phục bài viết thành công" });
        } catch (error) {
            console.error("Restore post error:", error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    },

    // ===== COMMENT MANAGEMENT =====

    // Xóa comment (soft delete)
    deleteComment: async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "ID không hợp lệ" });
            }

            const { Comment } = require("../models/comment.model");
            const comment = await Comment.findById(id);
            if (!comment) {
                return res.status(404).json({ message: "Comment không tồn tại" });
            }

            // Soft delete
            comment.isDeleted = true;
            comment.deletedAt = new Date();
            await comment.save();

            return res.status(200).json({ message: "Xóa comment thành công" });
        } catch (error) {
            console.error("Delete comment error:", error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    },

    // Khôi phục comment đã bị xóa
    restoreComment: async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "ID không hợp lệ" });
            }

            const { Comment } = require("../models/comment.model");
            const comment = await Comment.findById(id);
            if (!comment) {
                return res.status(404).json({ message: "Comment không tồn tại" });
            }

            if (!comment.isDeleted) {
                return res.status(400).json({ message: "Comment chưa bị xóa" });
            }

            comment.isDeleted = false;
            comment.deletedAt = null;
            await comment.save();

            return res.status(200).json({ message: "Khôi phục comment thành công" });
        } catch (error) {
            console.error("Restore comment error:", error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    },

    // ===== THỐNG KÊ =====

    // Thống kê tổng quan
    getDashboardStats: async (req, res) => {
        try {
            const totalUsers = await User.countDocuments({ isDeleted: { $ne: true } });
            const totalPosts = await Diary.countDocuments({ isDeleted: { $ne: true } });
            const publicPosts = await Diary.countDocuments({ isDeleted: { $ne: true }, isPublic: true });
            const privatePosts = await Diary.countDocuments({ isDeleted: { $ne: true }, isPublic: false });

            // Thống kê user theo role
            const userStats = await User.aggregate([
                { $match: { isDeleted: { $ne: true } } },
                { $group: { _id: "$role", count: { $sum: 1 } } }
            ]);

            // Thống kê bài viết theo mood
            const moodStats = await Diary.aggregate([
                { $match: { isDeleted: { $ne: true } } },
                { $group: { _id: "$mood", count: { $sum: 1 } } }
            ]);

            // Thống kê bài viết theo thời gian (7 ngày gần nhất)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const recentPosts = await Diary.countDocuments({
                createdAt: { $gte: sevenDaysAgo },
                isDeleted: { $ne: true }
            });

            // Thống kê báo cáo
            const { Report } = require("../models/report.model");
            const pendingReports = await Report.countDocuments({ isDeleted: { $ne: true }, status: "pending" });

            return res.status(200).json({
                overview: {
                    totalUsers,
                    totalPosts,
                    publicPosts,
                    privatePosts,
                    recentPosts,
                    pendingReports
                },
                userStats,
                moodStats
            });
        } catch (error) {
            console.error("Get dashboard stats error:", error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    }
};

module.exports = adminController;
