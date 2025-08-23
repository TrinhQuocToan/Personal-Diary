const mongoose = require("mongoose");
const User = require("../models/user.model");
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
  getAllUser: async (req, res) => {
    try {
      const users = await User.find();
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
            message: "Id is require d",
          });
        }
      }
      if (!id.trim() || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          message: "Invalid Id",
        });
      }

      const user = await User.findById(id);
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

      const allowedUpdates = ["fullName", "dob", "gender", "avatar"]
      const updates = {};
      for (const key of allowedUpdates) {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      }

      const updatedUser = await User.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Update user error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  uploadAvatarMiddleware: upload.single("avatar"),

  uploadAvatar: async (req, res) => {
    try {
      const id = req.params.id;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const avatarPath = `/uploads/avatars/${req.file.filename}`;
      const updatedUser = await User.findByIdAndUpdate(
        id,
        { avatar: avatarPath },
        { new: true }
      );
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(200).json({
        ...updatedUser.toObject(),
        avatar: avatarPath,
      });
    } catch (error) {
      console.error("Upload avatar error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
};
