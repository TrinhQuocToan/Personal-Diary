const mongoose = require("mongoose");
const Calendar = require("../models/calendar.model");
const User = require("../models/user.model");

module.exports = {
  showAllCalendar: async (req, res) => {
    try {
      const calendar = await Calendar.find({ userId: req.account.id });
      if (!calendar || calendar.length === 0) {
        return res.status(404).json({
          message: "Calendar not found",
        });
      }

      return res.status(200).json(calendar);
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },

  showDetailCalendar: async (req, res) => {
    try {
      const calendarId = req.params.id;

      if (!calendarId.trim()) {
        return res.status(400).json({ error: "CalendarID does not empty" });
      }

      if (!mongoose.Types.ObjectId.isValid(calendarId)) {
        return res
          .status(400)
          .json({ error: "CalendarID is not in the correct format." });
      }

      if (!Calendar.findById(calendarId)) {
        return res.status(404).json({ error: "CalendarID does not exists" });
      }

      const calendarInfo = await Calendar.findById(calendarId);

      return res.status(200).json(calendarInfo);
    } catch (error) {
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },

  addCalendar: async (req, res) => {
    try {
      const { date, tasks } = req.body;

      // Kiểm tra body rỗng
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          message: "Body cannot be empty. Please provide calendar details.",
        });
      }

      // Kiểm tra ngày hợp lệ
      const calendarDate = new Date(date);
      if (isNaN(calendarDate.getTime())) {
        return res
          .status(400)
          .json({ message: "Date must be a valid date string" });
      }

      // Kiểm tra mảng tasks
      if (!Array.isArray(tasks) || tasks.length === 0) {
        return res
          .status(400)
          .json({ message: "Tasks must be a non-empty array" });
      }

      // Lặp và validate từng task
      for (const task of tasks) {
        const { title, start, end, is_all_day } = task;

        if (!title || !title.trim()) {
          return res
            .status(400)
            .json({ message: "Each task must have a title" });
        }

        const startDate = new Date(start);
        const endDate = new Date(end);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return res
            .status(400)
            .json({ message: "Start and end must be valid date strings" });
        }

        if (startDate > endDate) {
          return res
            .status(400)
            .json({ message: "End date must be after start date" });
        }

        if (typeof is_all_day !== "boolean") {
          return res
            .status(400)
            .json({ message: "is_all_day must be a boolean value" });
        }
      }

      // Kiểm tra đã có document ngày này chưa
      const existingDoc = await Calendar.findOne({
        userId: req.account.id,
        date: calendarDate,
      });

      if (existingDoc) {
        // Nếu có, thêm task mới vào mảng
        existingDoc.tasks.push(...tasks);
        await existingDoc.save();

        return res.status(201).json({
          message: "Tasks added to existing calendar day",
          calendar: existingDoc,
        });
      } else {
        // Nếu chưa có, tạo mới
        const newCalendar = new Calendar({
          userId: req.account.id,
          date: calendarDate,
          tasks,
        });

        await newCalendar.save();

        return res.status(201).json({
          message: "Calendar created successfully",
          calendar: newCalendar,
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  updateCalendar: async (req, res) => {
    try {
      const { calendarId, taskId } = req.params;

      if (!calendarId || !mongoose.Types.ObjectId.isValid(calendarId)) {
        return res.status(400).json({ error: "Invalid or missing calendarId" });
      }

      if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ error: "Invalid or missing taskId" });
      }

      const { title, description, start, end, location, is_all_day } = req.body;

      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          message: "Body cannot be empty. Please provide task details.",
        });
      }

      if (!title || !title.trim()) {
        return res
          .status(400)
          .json({ message: "Missing required field: title" });
      }

      const startDate = new Date(start);
      const endDate = new Date(end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res
          .status(400)
          .json({ message: "Start and end must be valid date strings" });
      }

      if (startDate > endDate) {
        return res
          .status(400)
          .json({ message: "End date must be after start date" });
      }

      if (typeof is_all_day !== "boolean") {
        return res
          .status(400)
          .json({ message: "is_all_day must be a boolean value" });
      }

      // Tìm calendar theo calendarId và userId
      const calendar = await Calendar.findOne({
        _id: calendarId,
        userId: req.account.id,
      });
      if (!calendar) {
        return res
          .status(404)
          .json({ message: "Calendar not found or does not belong to user" });
      }

      // Tìm task theo taskId trong mảng tasks
      const task = calendar.tasks.id(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found in calendar" });
      }

      // Cập nhật task
      task.title = title;
      task.description = description;
      task.start = startDate;
      task.end = endDate;
      task.location = location;
      task.is_all_day = is_all_day;

      // Lưu lại calendar
      await calendar.save();

      return res.status(200).json({
        message: "Task updated successfully",
        task: task,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  deleteCalendar: async (req, res) => {
    try {
      const { calendarId, taskId } = req.params;

      if (!calendarId.trim() || !taskId.trim()) {
        return res.status(400).json({ error: "Missing calendarId or taskId" });
      }

      if (
        !mongoose.Types.ObjectId.isValid(calendarId) ||
        !mongoose.Types.ObjectId.isValid(taskId)
      ) {
        return res
          .status(400)
          .json({ error: "calendarId or taskId is not in the correct format" });
      }

      const calendar = await Calendar.findOne({
        _id: calendarId,
        userId: req.account.id,
      });

      if (!calendar) {
        return res.status(404).json({ error: "Calendar not found" });
      }

      const updatedCalendar = await Calendar.findByIdAndUpdate(
        calendarId,
        {
          $pull: { tasks: { _id: taskId } },
        },
        { new: true }
      );

      return res.status(200).json({
        message: "Task deleted successfully",
        calendar: updatedCalendar,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },

  getTomorrowTasks: async (req, res) => {
    try {
      // Lấy ngày mai
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().split("T")[0];

      // Lấy userId từ thông tin xác thực
      const userId = req.account.id;

      // Tìm Calendar cho ngày mai
      const calendar = await Calendar.findOne({
        userId: userId,
        date: tomorrowDate,
      });

      // Nếu không tìm thấy thì trả về data rỗng
      const tasks = calendar?.tasks || [];

      return res.status(200).json({
        date: tomorrowDate,
        data: tasks,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi hệ thống." });
    }
  },
};
