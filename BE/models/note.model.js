const mongoose = require("mongoose");

const DiarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    mood: {
      type: String,
      enum: ["happy", "sad", "excited", "angry", "peaceful", "anxious", "grateful", "other"],
      default: "other",
    },
    weather: {
      type: String,
      enum: ["sunny", "cloudy", "rainy", "snowy", "windy", "other"],
      default: "other",
    },
    isPublic: { 
      type: Boolean, 
      default: false 
    },
    tags: [{ 
      type: String, 
      trim: true 
    }],
    images: [{ 
      type: String 
    }],
    location: {
      type: String,
      default: "",
    },
    // Thêm danh sách người xem được (cho private sharing)
    allowedViewers: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    }],
    // Thống kê tương tác
    viewCount: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    // Soft delete
    isDeleted: { 
      type: Boolean, 
      default: false 
    },
    deletedAt: { 
      type: Date, 
      default: null 
    },
  },
  { timestamps: true, versionKey: false }
);

// Index cho tìm kiếm
DiarySchema.index({ userId: 1, createdAt: -1 });
DiarySchema.index({ isPublic: 1, createdAt: -1 });
DiarySchema.index({ tags: 1 });

const Diary = mongoose.model("Diary", DiarySchema, "diaries");
module.exports = { Diary };
