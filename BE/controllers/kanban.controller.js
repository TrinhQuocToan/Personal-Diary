const mongoose = require('mongoose');
const Calendar = require("../models/calendar.model");
const User = require("../models/user.model");
const Kanban = require("../models/kanban.model");

const showAllKanban = async (req, res) => {
  try {
    const userId = req.account?.id;

    if (!userId) {
      return res.status(400).json({ message: "Không có userId trong token" });
    }

    const kanban = await Kanban.find({ userId });
    if (!kanban || kanban.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bảng Kanban nào cho người dùng này" });
    }

    return res.status(200).json(kanban);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// GET /kanban/:userId - Lấy tất cả bảng của người dùng
const getKanbanByUser = async (req, res) => {
  const userId = req.params.userId;
  try {
    const kanbanBoards = await Kanban.find({ userId });
    if (!kanbanBoards.length) {
      return res.status(404).json({ message: "Không tìm thấy bảng Kanban nào" });
    }
    res.status(200).json(kanbanBoards);
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Lỗi server", error });
  }
};

// POST /kanban
const createKanban = async (req, res) => {
  try {
    const userId = req.account?.id; // lấy userId từ token
    const { boardName, tasks } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "Không có userId trong token" });
    }

    if (!boardName || !Array.isArray(tasks)) {
      return res.status(400).json({ message: "Thiếu boardName hoặc tasks không đúng định dạng mảng" });
    }

    // Tạo columns mặc định
    const columns = [
      { title: "To Do", tasks: tasks },
      { title: "In Progress", tasks: [] },
      { title: "Testing", tasks: [] },
      { title: "Done", tasks: [] },
    ];

    const newKanban = new Kanban({
      userId,
      boardName,
      columns,
    });

    await newKanban.save();

    res.status(201).json(newKanban);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};


// Di chuyển task giữa các cột /kanban/:kanbanId/move-task
const moveTask = async (req, res) => {
  try {
    const { kanbanId } = req.params;
    const { task, fromColumn, toColumn } = req.body;

    const kanban = await Kanban.findById(kanbanId);
    if (!kanban) {
      return res.status(404).json({ message: "Kanban không tồn tại" });
    }

    // Tìm column from và to
    const fromCol = kanban.columns.find(col => col.title === fromColumn);
    const toCol = kanban.columns.find(col => col.title === toColumn);

    if (!fromCol || !toCol) {
      return res.status(400).json({ message: "Không tìm thấy cột" });
    }

    // Xóa task khỏi fromColumn
    const taskIndex = fromCol.tasks.indexOf(task);
    if (taskIndex === -1) {
      return res.status(400).json({ message: "Task không tồn tại trong cột gốc" });
    }
    fromCol.tasks.splice(taskIndex, 1);

    // Thêm task vào toColumn
    toCol.tasks.push(task);

    await kanban.save();
    res.status(200).json(kanban);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};


// Thêm task mới vào cột  /kanban/:kanbanId/add-task
const addTask = async (req, res) => {
  try {
    const { kanbanId } = req.params;
    const { task, columnTitle } = req.body;

    const kanban = await Kanban.findById(kanbanId);
    if (!kanban) {
      return res.status(404).json({ message: "Kanban không tồn tại" });
    }

    // Tìm column cần thêm task
    const column = kanban.columns.find(col => col.title === columnTitle);
    if (!column) {
      return res.status(400).json({ message: "Không tìm thấy cột" });
    }

    column.tasks.push(task);

    await kanban.save();
    res.status(200).json(kanban);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// /kanban/:kanbanId/delete-task
const deleteTask = async (req, res) => {
  try {
    const { kanbanId } = req.params;
    const { task, columnTitle } = req.body;

    const kanban = await Kanban.findById(kanbanId);
    if (!kanban) {
      return res.status(404).json({ message: "Kanban không tồn tại" });
    }

    // Tìm column chứa task
    const column = kanban.columns.find(col => col.title === columnTitle);
    if (!column) {
      return res.status(400).json({ message: "Không tìm thấy cột" });
    }

    // Tìm và xóa task
    const taskIndex = column.tasks.indexOf(task);
    if (taskIndex === -1) {
      return res.status(404).json({ message: "Không tìm thấy task trong cột" });
    }
    column.tasks.splice(taskIndex, 1);

    await kanban.save();
    res.status(200).json({ message: "Xóa task thành công", kanban });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// DELETE /kanban/:kanbanId - Xóa một bảng Kanban
const deleteKanban = async (req, res) => {
  try {
    const { kanbanId } = req.params;

    const deletedKanban = await Kanban.findByIdAndDelete(kanbanId);

    if (!deletedKanban) {
      return res.status(404).json({ message: "Không tìm thấy bảng Kanban để xóa" });
    }

    res.status(200).json({ message: "Xóa bảng Kanban thành công", deletedKanban });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server khi xóa Kanban", error });
  }
};

const getKanbanStats = async (req, res) => {
  try {
    const userId = req.account.id;  

    const kanbans = await Kanban.find({ userId: mongoose.Types.ObjectId(userId) });

    if (!kanbans || kanbans.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy Kanban cho userId này" });
    }

    const stats = {
      todo: 0,
      inProgress: 0,
      done: 0,
      testing: 0,
    };

    kanbans.forEach(kanban => {
      kanban.columns.forEach(column => {
        column.tasks.forEach(task => {
          if (column.title === "To Do") {
            stats.todo++;
          } else if (column.title === "In Progress") {
            stats.inProgress++;
          } else if (column.title === "Done") {
            stats.done++;
          } else if (column.title === "Testing") {
            stats.testing++;
          }
        });
      });
    });

    res.status(200).json(stats);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server khi lấy thống kê", error });
  }
};

module.exports = {
  showAllKanban,
  getKanbanByUser,
  createKanban,
  addTask,
  moveTask,
  deleteTask,
  deleteKanban,
  getKanbanStats
};