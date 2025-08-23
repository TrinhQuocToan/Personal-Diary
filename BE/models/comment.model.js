const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    diaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Diary",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    // Hỗ trợ reply comment (nested comments)
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    // Thống kê
    likeCount: {
      type: Number,
      default: 0,
    },
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, versionKey: false }
);

// Index cho hiệu suất
CommentSchema.index({ diaryId: 1, createdAt: -1 });
CommentSchema.index({ userId: 1, createdAt: -1 });
CommentSchema.index({ parentCommentId: 1 });

const Comment = mongoose.model("Comment", CommentSchema, "comments");
module.exports = { Comment };
