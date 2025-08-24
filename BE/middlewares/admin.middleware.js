const mongoose = require("mongoose");
const User = require("../models/user.model");

const isAdmin = async (req, res, next) => {
    try {
        // Kiểm tra xem đã có thông tin user từ auth middleware chưa
        if (!req.account || !req.account.id) {
            return res.status(401).json({ message: "Không có quyền truy cập" });
        }

        // Kiểm tra xem user có tồn tại và có role admin không
        const user = await User.findById(req.account.id);
        if (!user) {
            return res.status(404).json({ message: "User không tồn tại" });
        }

        if (user.role !== "admin") {
            return res.status(403).json({ message: "Chỉ Admin mới có quyền truy cập" });
        }

        // Gắn thông tin user vào req để sử dụng ở controller
        req.adminUser = user;
        next();
    } catch (error) {
        console.error("Admin middleware error:", error);
        return res.status(500).json({ message: "Lỗi server" });
    }
};

module.exports = isAdmin;
