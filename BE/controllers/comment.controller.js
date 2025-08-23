const { Comment } = require("../models/comment.model");
const { Diary } = require("../models/note.model");
const { Like } = require("../models/like.model");

// Tạo comment mới
exports.createComment = async (req, res) => {
  try {
    const { diaryId, content, parentCommentId } = req.body;

    // Kiểm tra diary có tồn tại và public
    const diary = await Diary.findOne({
      _id: diaryId,
      isDeleted: false,
      $or: [
        { isPublic: true },
        { userId: req.account.id },
        { allowedViewers: req.account.id }
      ]
    });

    if (!diary) {
      return res.status(404).json({ message: "Không tìm thấy nhật ký hoặc bạn không có quyền bình luận" });
    }

    const commentData = {
      diaryId,
      userId: req.account.id,
      content,
      parentCommentId: parentCommentId || null,
    };

    const newComment = new Comment(commentData);
    await newComment.save();

    // Cập nhật comment count cho diary
    await Diary.findByIdAndUpdate(diaryId, { $inc: { commentCount: 1 } });

    // Populate user info
    await newComment.populate('userId', 'fullName avatar');

    res.status(201).json({
      message: "Tạo bình luận thành công",
      comment: newComment
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// Lấy comments của một diary
exports.getComments = async (req, res) => {
  try {
    const { diaryId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Kiểm tra quyền truy cập diary
    const diary = await Diary.findOne({
      _id: diaryId,
      isDeleted: false,
      $or: [
        { isPublic: true },
        { userId: req.account.id },
        { allowedViewers: req.account.id }
      ]
    });

    if (!diary) {
      return res.status(404).json({ message: "Không tìm thấy nhật ký" });
    }

    // Lấy comments gốc
    const comments = await Comment.find({
      diaryId,
      isDeleted: false,
      parentCommentId: null
    })
    .populate('userId', 'fullName avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    // Lấy replies cho mỗi comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({
          parentCommentId: comment._id,
          isDeleted: false
        })
        .populate('userId', 'fullName avatar')
        .sort({ createdAt: 1 })
        .limit(10);
        
        return {
          ...comment.toObject(),
          replies
        };
      })
    );

    const total = await Comment.countDocuments({
      diaryId,
      isDeleted: false,
      parentCommentId: null
    });

    res.status(200).json({
      comments: commentsWithReplies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// Cập nhật comment
exports.updateComment = async (req, res) => {
  try {
    const { content } = req.body;

    const comment = await Comment.findOneAndUpdate(
      { _id: req.params.id, userId: req.account.id, isDeleted: false },
      { content },
      { new: true }
    ).populate('userId', 'fullName avatar');

    if (!comment) {
      return res.status(404).json({ message: "Không tìm thấy bình luận để cập nhật" });
    }

    res.status(200).json({
      message: "Cập nhật bình luận thành công",
      comment
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// Xoá comment
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findOneAndUpdate(
      { _id: req.params.id, userId: req.account.id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({ message: "Không tìm thấy bình luận để xoá" });
    }

    // Giảm comment count cho diary
    await Diary.findByIdAndUpdate(comment.diaryId, { $inc: { commentCount: -1 } });

    res.status(200).json({ message: "Đã xoá bình luận thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// Toggle Like/Unlike diary
exports.toggleLikeDiary = async (req, res) => {
  try {
    const { diaryId } = req.params;
    const userId = req.account.id;
    
    const diary = await Diary.findOne({
      _id: diaryId,
      isDeleted: false,
      $or: [
        { isPublic: true },
        { userId: req.account.id },
        { allowedViewers: req.account.id }
      ]
    });

    if (!diary) {
      return res.status(404).json({ message: "Không tìm thấy nhật ký" });
    }

    // Kiểm tra xem user đã like chưa
    const existingLike = await Like.findOne({ userId, diaryId });

    let message, isLiked;
    
    if (existingLike) {
      // Đã like rồi -> Unlike (xóa like)
      await Like.deleteOne({ userId, diaryId });
      await Diary.findByIdAndUpdate(diaryId, { $inc: { likeCount: -1 } });
      message = "Đã bỏ thích nhật ký";
      isLiked = false;
    } else {
      // Chưa like -> Like (tạo like mới)
      await Like.create({ userId, diaryId });
      await Diary.findByIdAndUpdate(diaryId, { $inc: { likeCount: 1 } });
      message = "Đã thích nhật ký";
      isLiked = true;
    }

    // Lấy số lượng like hiện tại
    const updatedDiary = await Diary.findById(diaryId);

    res.status(200).json({ 
      message,
      isLiked,
      likeCount: updatedDiary.likeCount
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

module.exports = exports;
