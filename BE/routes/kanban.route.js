const express = require('express');
const router = express.Router();
const kanbanController = require('../controllers/kanban.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Kanban routes
router.get('/kanban', authMiddleware, kanbanController.showAllKanban);
router.get('/kanban/user', authMiddleware, kanbanController.getKanbanByUser);
router.post('/kanban', authMiddleware, kanbanController.createKanban);
router.post('/kanban/task', authMiddleware, kanbanController.addTask);
router.put('/kanban/task/move', authMiddleware, kanbanController.moveTask);
router.delete('/kanban/task/:id', authMiddleware, kanbanController.deleteTask);
router.delete('/kanban/:id', authMiddleware, kanbanController.deleteKanban);
router.get('/kanban/stats', authMiddleware, kanbanController.getKanbanStats);

module.exports = router;
