const { Diary } = require("../models/note.model");
const { Comment } = require("../models/comment.model");
const mongoose = require("mongoose");

// Lấy tất cả nhật ký (của user và public)
exports.showAllDiaries = async (req, res) => {
  try {
    const { page = 1, limit = 10, mood, weather, tags } = req.query;
    const skip = (page - 1) * limit;
    
    let filter = {
      $and: [
        { isDeleted: false },
        {
          $or: [{ userId: req.account.id }, { isPublic: true }],
        },
      ],
    };
    
    // Thêm filter theo mood, weather, tags
    if (mood) filter.mood = mood;
    if (weather) filter.weather = weather;
    if (tags) filter.tags = { $in: tags.split(',') };

    const diaries = await Diary.find(filter)
      .populate('userId', 'fullName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Diary.countDocuments(filter);

    res.status(200).json({
      diaries,
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

// Lấy nhật ký cá nhân của user
exports.getMyDiaries = async (req, res) => {
  try {
    const { page = 1, limit = 10, includeDeleted = false } = req.query;
    const skip = (page - 1) * limit;
    
    let filter = { userId: req.account.id };
    if (!includeDeleted) {
      filter.isDeleted = false;
    }

    const diaries = await Diary.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Diary.countDocuments(filter);

    res.status(200).json({
      diaries,
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

// Lấy chi tiết một nhật ký
exports.getDiaryDetail = async (req, res) => {
  try {
    const diary = await Diary.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).populate('userId', 'fullName avatar');

    if (!diary) {
      return res.status(404).json({ message: "Không tìm thấy nhật ký" });
    }

    const isOwner = diary.userId._id.toString() === req.account.id;
    const isAllowedViewer = diary.allowedViewers?.some(
      (viewerId) => viewerId.toString() === req.account.id
    );

    // Kiểm tra quyền truy cập
    if (!isOwner && !diary.isPublic && !isAllowedViewer) {
      return res.status(403).json({ message: "Bạn không có quyền truy cập nhật ký này" });
    }

    // Tăng view count nếu không phải chủ sở hữu
    if (!isOwner) {
      await Diary.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    }

    // Lấy comments
    const comments = await Comment.find({
      diaryId: req.params.id,
      isDeleted: false,
      parentCommentId: null // Chỉ lấy comment gốc
    })
    .populate('userId', 'fullName avatar')
    .sort({ createdAt: -1 })
    .limit(20);

    // Lấy replies cho mỗi comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({
          parentCommentId: comment._id,
          isDeleted: false
        })
        .populate('userId', 'fullName avatar')
        .sort({ createdAt: 1 })
        .limit(5);
        
        return {
          ...comment.toObject(),
          replies
        };
      })
    );

    res.status(200).json({
      diary,
      comments: commentsWithReplies,
      isOwner
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};


// Tạo nhật ký mới
exports.createDiary = async (req, res) => {
  try {
    const {
      title,
      content,
      mood,
      weather,
      isPublic,
      tags,
      location,
      allowedViewers,
    } = req.body;

    const diaryData = {
      userId: req.account.id,
      title,
      content,
      mood: mood || 'other',
      weather: weather || 'other',
      isPublic: isPublic || false,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : [],
      location: location || '',
      allowedViewers: allowedViewers || [],
    };

    // Xử lý upload nhiều ảnh
    if (req.files && req.files.length > 0) {
      diaryData.images = req.files.map(file => file.filename);
    }

    const newDiary = new Diary(diaryData);
    await newDiary.save();

    res.status(201).json({
      message: "Tạo nhật ký thành công",
      diary: newDiary
    });
  } catch (err) {
    console.error("Error creating diary:", err);
    res.status(500).json({ error: "Lỗi máy chủ khi tạo nhật ký" });
  }
};


// Cập nhật nhật ký
exports.updateDiary = async (req, res) => {
  try {
    const {
      title,
      content,
      mood,
      weather,
      isPublic,
      tags,
      location,
      allowedViewers
    } = req.body;
    
    const updateData = {
      title,
      content,
      mood: mood || 'other',
      weather: weather || 'other',
      isPublic: isPublic ?? false,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : [],
      location: location || '',
      allowedViewers: allowedViewers || [],
    };

    // Xử lý upload ảnh mới
    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(file => file.filename);
    }

    const diary = await Diary.findOneAndUpdate(
      { _id: req.params.id, userId: req.account.id, isDeleted: false },
      updateData,
      { new: true }
    );

    if (!diary) {
      return res.status(404).json({ message: "Không tìm thấy nhật ký để cập nhật" });
    }

    res.status(200).json({
      message: "Cập nhật nhật ký thành công",
      diary
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};


// Xoá mềm nhật ký
exports.deleteDiary = async (req, res) => {
  try {
    const diary = await Diary.findOneAndUpdate(
      { _id: req.params.id, userId: req.account.id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!diary) {
      return res.status(404).json({ message: "Không tìm thấy nhật ký để xoá" });
    }

    res.status(200).json({ message: "Đã xoá nhật ký thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// Khôi phục nhật ký đã xoá
exports.restoreDiary = async (req, res) => {
  try {
    const diary = await Diary.findOneAndUpdate(
      { _id: req.params.id, userId: req.account.id, isDeleted: true },
      { isDeleted: false, deletedAt: null },
      { new: true }
    );

    if (!diary) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy nhật ký để khôi phục" });
    }

    res.status(200).json({ message: "Đã khôi phục nhật ký thành công", diary });
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// Thống kê nhật ký theo ngày
exports.getDiaryStats = async (req, res) => {
  try {
    const diaries = await Diary.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.account.id),
          isDeleted: false,
          createdAt: { $type: "date" },
        },
      },
      {
        $project: {
          day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          mood: 1,
          weather: 1,
        },
      },
      {
        $group: {
          _id: "$day",
          count: { $sum: 1 },
          moods: { $push: "$mood" },
          weathers: { $push: "$weather" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.status(200).json({
      total: diaries.length,
      diaries: diaries.map((diary) => ({
        date: diary._id,
        count: diary.count,
        moods: diary.moods,
        weathers: diary.weathers,
      })),
    });
  } catch (error) {
    console.error("Lỗi backend:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
