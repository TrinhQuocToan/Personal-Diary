const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
require("dotenv").config();

const createAdminUser = async () => {
    try {
        // Kết nối database
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // Kiểm tra xem đã có admin chưa
        const existingAdmin = await User.findOne({ role: "admin" });
        if (existingAdmin) {
            console.log("⚠️ Admin user already exists");
            console.log("Email:", existingAdmin.email);
            console.log("Username:", existingAdmin.username);
            return;
        }

        // Tạo admin user
        const adminData = {
            fullName: "System Administrator",
            username: "admin",
            email: "admin@diary.com",
            password: "admin123456",
            role: "admin",
            dob: new Date("1990-01-01"),
            gender: "Other"
        };

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);

        // Tạo user mới
        const adminUser = new User({
            ...adminData,
            password: hashedPassword
        });

        await adminUser.save();
        console.log("✅ Admin user created successfully!");
        console.log("Email:", adminData.email);
        console.log("Username:", adminData.username);
        console.log("Password:", adminData.password);
        console.log("Role:", adminData.role);

    } catch (error) {
        console.error("❌ Error creating admin user:", error);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected from MongoDB");
    }
};

// Chạy script
createAdminUser();
