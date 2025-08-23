const express = require('express');
const router = express.Router();
const noteController = require('../controllers/note.controller');
const commentController = require('../controllers/comment.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Note/Diary routes
router.get('/diaries', authMiddleware, noteController.showAllDiaries);
router.get('/my-diaries', authMiddleware, noteController.getMyDiaries);
router.get('/diaries/:id', authMiddleware, noteController.getDiaryDetail);
router.post('/diaries', authMiddleware, noteController.createDiary);
router.put('/diaries/:id', authMiddleware, noteController.updateDiary);
router.delete('/diaries/:id', authMiddleware, noteController.deleteDiary);
router.post('/diaries/:id/restore', authMiddleware, noteController.restoreDiary);
router.get('/diary-stats', authMiddleware, noteController.getDiaryStats);
router.put('/diaries/:diaryId/like', authMiddleware, commentController.toggleLikeDiary);

// Comment routes for diaries
router.get('/diaries/:diaryId/comments', authMiddleware, commentController.getComments);
router.post('/comments', authMiddleware, commentController.createComment);
router.put('/comments/:id', authMiddleware, commentController.updateComment);
router.delete('/comments/:id', authMiddleware, commentController.deleteComment);

module.exports = router;
