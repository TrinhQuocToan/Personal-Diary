const mongoose = require("mongoose");

const LikeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    diaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Diary",
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

// Đảm bảo một user chỉ có thể like một diary một lần
LikeSchema.index({ userId: 1, diaryId: 1 }, { unique: true });

const Like = mongoose.model("Like", LikeSchema, "likes");
module.exports = { Like };
