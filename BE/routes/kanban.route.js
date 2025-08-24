const express = require('express');
const router = express.Router();
const kanbanController = require('../controllers/kanban.controller')
const verifyToken = require('../middlewares/auth.middleware');

router.get("/kanban", verifyToken, kanbanController.showAllKanban);
router.get("/kanban/:userId", verifyToken, kanbanController.getKanbanByUser);

router.post("/kanban", verifyToken, kanbanController.createKanban);

router.put("/kanban/:kanbanId/move-task", verifyToken, kanbanController.moveTask);
router.put("/kanban/:kanbanId/add-task", verifyToken, kanbanController.addTask);
router.put("/kanban/:kanbanId/delete-task", verifyToken, kanbanController.deleteTask);
router.get("/kanbanStats", verifyToken, kanbanController.getKanbanStats)
router.delete("/kanban/:kanbanId",verifyToken, kanbanController.deleteKanban)
module.exports = router;