const mongoose = require("mongoose");
const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer storage for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads/avatars");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    let ext = path.extname(file.originalname);
    ext = ext.toLowerCase();
    cb(null, req.params.id + ext);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Only JPEG and PNG images are allowed"));
    }
  },
});

module.exports = {
  getCurrentUser: async (req, res) => {
    try {
      const userId = req.account.id;
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await User.findById(userId).select("-password");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json(user);
    } catch (error) {
      console.error("Get current user error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  getAllUser: async (req, res) => {
    try {
      const users = await User.find().select("-password");
      return res.status(200).json(users);
    } catch (error) {
      console.log("error", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },

  getUserById: async (req, res) => {
    try {
      let id = req.params.id;
      if (!id) {
        if (req.session && req.session.userId) {
          id = req.session.userId;
        } else {
          return res.status(400).json({
            message: "Id is required",
          });
        }
      }
      if (!id.trim() || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          message: "Invalid Id",
        });
      }

      const user = await User.findById(id).select("-password");
      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      return res.status(200).json(user);
    } catch (error) {
      console.log("Error", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },

  updateUser: async (req, res) => {
    try {
      const id = req.params.id;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Validate if user is updating their own profile or has admin rights
      const currentUserId = req.account.id;
      if (currentUserId !== id) {
        return res
          .status(403)
          .json({ message: "You can only update your own profile" });
      }

      const allowedUpdates = [
        "fullName",
        "dob",
        "gender",
        "avatar",
        "mobileNumber",
        "address1",
        "country",
      ];
      const updates = {};

      // Validate and sanitize updates
      for (const key of allowedUpdates) {
        if (req.body[key] !== undefined) {
          if (key === "fullName") {
            const fullName = req.body[key].trim();
            if (!fullName) {
              return res
                .status(400)
                .json({ message: "Full name cannot be empty" });
            }
            if (fullName.length > 50) {
              return res
                .status(400)
                .json({ message: "Full name cannot exceed 50 characters" });
            }
            if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(fullName)) {
              return res.status(400).json({
                message: "Full name can only contain letters and spaces",
              });
            }
            updates[key] = fullName;
          } else if (key === "dob") {
            if (req.body[key]) {
              const dobDate = new Date(req.body[key]);
              const today = new Date();
              const age = today.getFullYear() - dobDate.getFullYear();

              if (dobDate > today) {
                return res
                  .status(400)
                  .json({ message: "Date of birth cannot be in the future" });
              }
              if (age < 13) {
                return res
                  .status(400)
                  .json({ message: "You must be at least 13 years old" });
              }
              if (age > 120) {
                return res
                  .status(400)
                  .json({ message: "Please enter a valid date of birth" });
              }
            }
            updates[key] = req.body[key];
          } else if (key === "gender") {
            if (
              req.body[key] &&
              !["Male", "Female", "Other"].includes(req.body[key])
            ) {
              return res.status(400).json({ message: "Invalid gender value" });
            }
            updates[key] = req.body[key];
          } else if (key === "mobileNumber") {
            const mobileNumber = req.body[key].trim();
            if (mobileNumber && !/^\+?[\d\s\-()]{8,15}$/.test(mobileNumber)) {
              return res.status(400).json({
                message: "Please enter a valid phone number",
              });
            }
            updates[key] = mobileNumber;
          } else if (key === "address1") {
            const address1 = req.body[key].trim();
            if (address1 && address1.length > 200) {
              return res.status(400).json({
                message: "Address cannot exceed 200 characters",
              });
            }
            updates[key] = address1;
          } else if (key === "country") {
            const country = req.body[key].trim();
            if (country && country.length > 50) {
              return res.status(400).json({
                message: "Country name cannot exceed 50 characters",
              });
            }
            updates[key] = country;
          } else {
            updates[key] = req.body[key];
          }
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      updates.updatedAt = new Date();

      const updatedUser = await User.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      }).select("-password");

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Update user error:", error);
      if (error.name === "ValidationError") {
        const errorMessage =
          Object.values(error.errors)[0]?.message || "Validation error";
        return res.status(400).json({ message: errorMessage });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  changePassword: async (req, res) => {
    try {
      const userId = req.account.id;
      const { currentPassword, newPassword } = req.body;

      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          message: "Current password and new password are required",
        });
      }

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isValidPassword) {
        return res.status(400).json({
          message: "Current password is incorrect",
        });
      }

      // Check if new password is different from current
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return res.status(400).json({
          message: "New password must be different from current password",
        });
      }

      // Hash new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await User.findByIdAndUpdate(userId, {
        password: hashedNewPassword,
        updatedAt: new Date(),
      });

      return res.status(200).json({
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },

  changeEmail: async (req, res) => {
    try {
      const userId = req.account.id;
      const { newEmail, password } = req.body;

      // Validate input
      if (!newEmail || !password) {
        return res.status(400).json({
          message: "New email and password are required",
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        return res.status(400).json({
          message: "Please enter a valid email address",
        });
      }

      // Normalize email
      const normalizedEmail = newEmail.toLowerCase().trim();

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if new email is different from current
      if (normalizedEmail === user.email.toLowerCase()) {
        return res.status(400).json({
          message: "New email must be different from current email",
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({
          message: "Password is incorrect",
        });
      }

      // Check if email is already in use by another user
      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: userId },
      });

      if (existingUser) {
        return res.status(400).json({
          message: "This email address is already in use",
        });
      }

      // Update email
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          email: normalizedEmail,
          updatedAt: new Date(),
        },
        { new: true }
      ).select("-password");

      return res.status(200).json({
        message: "Email changed successfully",
        email: updatedUser.email,
      });
    } catch (error) {
      console.error("Change email error:", error);

      // Handle duplicate key error
      if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
        return res.status(400).json({
          message: "This email address is already in use",
        });
      }

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },

  uploadAvatarMiddleware: upload.single("avatar"),

  uploadAvatar: async (req, res) => {
    try {
      const id = req.params.id;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Validate if user is uploading their own avatar
      const currentUserId = req.account.id;
      if (currentUserId !== id) {
        return res
          .status(403)
          .json({ message: "You can only update your own avatar" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Delete old avatar if exists
      const existingUser = await User.findById(id);
      if (existingUser && existingUser.avatar) {
        const oldAvatarPath = path.join(__dirname, "..", existingUser.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          try {
            fs.unlinkSync(oldAvatarPath);
          } catch (error) {
            console.error("Error deleting old avatar:", error);
          }
        }
      }

      const avatarPath = `/uploads/avatars/${req.file.filename}`;
      const updatedUser = await User.findByIdAndUpdate(
        id,
        {
          avatar: avatarPath,
          updatedAt: new Date(),
        },
        { new: true }
      ).select("-password");

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        ...updatedUser.toObject(),
        avatar: avatarPath,
      });
    } catch (error) {
      console.error("Upload avatar error:", error);

      // Clean up uploaded file if there was an error
      if (req.file) {
        const filePath = req.file.path;
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (cleanupError) {
            console.error("Error cleaning up file:", cleanupError);
          }
        }
      }

      if (error.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ message: "File size too large. Maximum 5MB allowed." });
      }

      return res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const id = req.params.id;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Only allow admin to delete users or user to delete their own account
      const currentUserId = req.account.id;
      const currentUser = await User.findById(currentUserId);

      if (currentUserId !== id && currentUser.role !== "admin") {
        return res.status(403).json({
          message: "You can only delete your own account or need admin rights",
        });
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Delete avatar file if exists
      if (user.avatar) {
        const avatarPath = path.join(__dirname, "..", user.avatar);
        if (fs.existsSync(avatarPath)) {
          try {
            fs.unlinkSync(avatarPath);
          } catch (error) {
            console.error("Error deleting avatar file:", error);
          }
        }
      }

      await User.findByIdAndDelete(id);

      return res.status(200).json({
        message: "User account deleted successfully",
      });
    } catch (error) {
      console.error("Delete user error:", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },

  updateUserRole: async (req, res) => {
    try {
      const id = req.params.id;
      const { role } = req.body;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Only admin can update user roles
      const currentUserId = req.account.id;
      const currentUser = await User.findById(currentUserId);

      if (currentUser.role !== "admin") {
        return res.status(403).json({
          message: "Only admin can update user roles",
        });
      }

      if (!role || !["user", "admin"].includes(role)) {
        return res.status(400).json({
          message: "Invalid role. Must be 'user' or 'admin'",
        });
      }

      const updatedUser = await User.findByIdAndUpdate(
        id,
        { role, updatedAt: new Date() },
        { new: true }
      ).select("-password");

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        message: "User role updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Update user role error:", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },

  getUserStats: async (req, res) => {
    try {
      const currentUserId = req.account.id;
      const currentUser = await User.findById(currentUserId);

      // Only admin can view user statistics
      if (currentUser.role !== "admin") {
        return res.status(403).json({
          message: "Only admin can view user statistics",
        });
      }

      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({
        updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
      });
      const adminUsers = await User.countDocuments({ role: "admin" });
      const regularUsers = await User.countDocuments({ role: "user" });

      // Gender distribution
      const genderStats = await User.aggregate([
        {
          $group: {
            _id: "$gender",
            count: { $sum: 1 },
          },
        },
      ]);

      // Users created in the last 30 days
      const newUsers = await User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      });

      return res.status(200).json({
        totalUsers,
        activeUsers,
        adminUsers,
        regularUsers,
        newUsers,
        genderDistribution: genderStats,
      });
    } catch (error) {
      console.error("Get user stats error:", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
};
