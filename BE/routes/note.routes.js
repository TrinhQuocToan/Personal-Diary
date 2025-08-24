const express = require("express");
const router = express.Router();
const diaryController = require("../controllers/note.controller");
const commentController = require("../controllers/comment.controller");
const verifyToken = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

// Diary routes
router.get("/diaries", verifyToken, diaryController.showAllDiaries);
router.get("/diaries/my", verifyToken, diaryController.getMyDiaries);
router.get("/diaries/:id", verifyToken, diaryController.getDiaryDetail);
router.post("/diaries", verifyToken, upload.array("images", 5), diaryController.createDiary);
router.put("/diaries/:id", verifyToken, upload.array("images", 5), diaryController.updateDiary);
router.delete("/diaries/:id", verifyToken, diaryController.deleteDiary);
router.put("/diaries/:id/restore", verifyToken, diaryController.restoreDiary);

// Comment routes
router.get("/diaries/:diaryId/comments", verifyToken, commentController.getComments);
router.post("/comments", verifyToken, commentController.createComment);
router.put("/comments/:id", verifyToken, commentController.updateComment);
router.delete("/comments/:id", verifyToken, commentController.deleteComment);

// Like/Unlike routes
router.post("/diaries/:diaryId/like", verifyToken, commentController.toggleLikeDiary);

module.exports = router;
