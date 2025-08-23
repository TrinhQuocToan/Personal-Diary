const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendar.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Calendar routes
router.get('/calendar', authMiddleware, calendarController.showAllCalendar);
router.get('/calendar/:id', authMiddleware, calendarController.showDetailCalendar);
router.post('/calendar', authMiddleware, calendarController.addCalendar);
router.put('/calendar/:calendarId/tasks/:taskId', authMiddleware, calendarController.updateCalendar);
router.delete('/calendar/:calendarId/tasks/:taskId', authMiddleware, calendarController.deleteCalendar);
router.get('/tomorrow-tasks', authMiddleware, calendarController.getTomorrowTasks);

module.exports = router;
