import React, { useEffect, useState } from "react";
import { Header } from "../components";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import axiosInstance from "./Authentication/helper/axiosInstance";

const Kanban = () => {
  const [kanbans, setKanbans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newTasks, setNewTasks] = useState("");
  const [newTaskInput, setNewTaskInput] = useState({}); // key = `${kanbanId}_${columnTitle}`
  const [moveTaskData, setMoveTaskData] = useState(null); // moveTaskData = { kanbanId, fromColumn, task }

  useEffect(() => {
    fetchKanbans();
  }, []);

  const fetchKanbans = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("/api/kanban", {});
      setKanbans(response.data);
    } catch (error) {
      // toast.error(error?.response?.data?.message || "Lỗi tải Kanban");
      setKanbans([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) {
      toast.error("Vui lòng nhập tên bảng");
      return;
    }

    const taskArray = newTasks
      .split(",")
      .map((task) => task.trim())
      .filter((task) => task.length > 0);

    try {
      await axiosInstance.post("/api/kanban", {
        boardName: newBoardName,
        tasks: taskArray,
      });
      toast.success("Tạo bảng thành công!");
      setNewBoardName("");
      setNewTasks("");
      setShowCreateForm(false);
      fetchKanbans();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Tạo bảng thất bại");
    }
  };

  const handleAddTask = async (kanbanId, columnTitle) => {
    if (columnTitle !== "To Do") {
      toast.error("Chỉ được thêm task vào cột To Do!");
      return;
    }

    const key = `${kanbanId}_${columnTitle}`;
    const task = newTaskInput[key]?.trim();

    if (!task) {
      toast.error("Vui lòng nhập nội dung task");
      return;
    }

    try {
      await axiosInstance.put(`/api/kanban/${kanbanId}/add-task`, {
        task,
        columnTitle,
      });
      toast.success(`Thêm task "${task}" thành công! ✅`);
      fetchKanbans();
      setNewTaskInput((prev) => ({ ...prev, [key]: "" }));
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Thêm task thất bại");
    }
  };

  const handleDeleteTask = async (kanbanId, columnTitle, task) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa task "${task}" không?`)) {
      return;
    }

    try {
      await axiosInstance.put(`/api/kanban/${kanbanId}/delete-task`, {
        task,
        columnTitle,
      });
      toast.success(`Đã xóa task "${task}" thành công!`);
      fetchKanbans();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Xóa task thất bại");
    }
  };

  const handleMoveTask = async (kanbanId, fromColumn, toColumn, task) => {
    try {
      await axiosInstance.put(`/api/kanban/${kanbanId}/move-task`, {
        task,
        fromColumn,
        toColumn,
      });
      toast.success(`✅ Đã chuyển "${task}" đến cột "${toColumn}"!`);
      fetchKanbans();
      setMoveTaskData(null);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Di chuyển task thất bại");
    }
  };

  const handleDeleteBoard = async (kanbanId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bảng Kanban này không?")) {
      return;
    }

    try {
      await axiosInstance.delete(`/api/kanban/${kanbanId}`);
      toast.success("Xóa bảng Kanban thành công!");
      fetchKanbans();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Xóa bảng thất bại");
    }
  };

  return (
    <div className="m-2 md:m-10 mt-24 p-4 md:p-10 bg-white rounded-3xl">
      <Header title="Các bảng Kanban của bạn" />
      <ToastContainer />
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
        >
          {showCreateForm ? "Đóng" : "➕ Tạo bảng mới"}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-gray-100 p-6 rounded-lg mb-10">
          <h2 className="text-xl font-semibold mb-4">Tạo bảng mới</h2>
          <div className="mb-4">
            <label className="block mb-2 font-medium">Tên bảng</label>
            <input
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="Nhập tên bảng Kanban"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2 font-medium">
              Tasks ban đầu (phân cách bằng dấu phẩy)
            </label>
            <input
              type="text"
              value={newTasks}
              onChange={(e) => setNewTasks(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="Ví dụ: Task 1, Task 2, Task 3"
            />
          </div>
          <button
            onClick={handleCreateBoard}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-6 rounded-lg"
          >
            Tạo
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center my-10 text-lg">Đang tải dữ liệu...</div>
      ) : (
        <>
          {kanbans.length === 0 ? (
            <div className="text-center text-gray-500 my-10">
              Không có bảng Kanban nào.
            </div>
          ) : (
            kanbans.map((kanban) => (
              <div key={kanban._id} className="mb-16">
                <div className="flex justify-center items-center gap-4 mb-6">
                  <h2 className="text-2xl font-semibold text-center">
                    {kanban.boardName}
                  </h2>
                  <button
                    onClick={() => handleDeleteBoard(kanban._id)}
                    className="bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 font-bold text-xl p-2 rounded-full shadow-md transition duration-300"
                    title="Xóa bảng"
                  >
                    Xóa 🗑️
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {moveTaskData && (
                    <>
                      {/* Nền mờ backdrop */}
                      <div
                        className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40"
                        onClick={() => setMoveTaskData(null)}
                      ></div>

                      {/* Modal move task */}
                      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-8 z-50 w-[90%] max-w-md">
                        <h3 className="text-2xl font-bold mb-6 text-center">
                          🚚 Di chuyển Task
                        </h3>

                        <p className="text-center mb-4">
                          Task:{" "}
                          <span className="font-semibold text-blue-600">
                            {moveTaskData.task}
                          </span>
                        </p>
                        <p className="text-center mb-8">
                          Từ:{" "}
                          <span className="font-semibold text-green-600">
                            {moveTaskData.fromColumn}
                          </span>
                        </p>

                        <div className="flex flex-col gap-4">
                          {kanbans
                            .find((k) => k._id === moveTaskData.kanbanId)
                            ?.columns.filter(
                              (col) => col.title !== moveTaskData.fromColumn
                            )
                            .map((col) => (
                              <button
                                key={col.title}
                                onClick={() =>
                                  handleMoveTask(
                                    moveTaskData.kanbanId,
                                    moveTaskData.fromColumn,
                                    col.title,
                                    moveTaskData.task
                                  )
                                }
                                className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition"
                              >
                                ➡️ Di chuyển tới "{col.title}"
                              </button>
                            ))}

                          <button
                            onClick={() => setMoveTaskData(null)}
                            className="bg-gray-400 hover:bg-gray-500 text-white py-2 rounded-lg font-semibold transition"
                          >
                            ❌ Hủy
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {kanban.columns.map((column) => {
                    const key = `${kanban._id}_${column.title}`;
                    const isTodoColumn = column.title === "To Do"; // Chỉ cho To Do

                    return (
                      <div
                        key={column.title}
                        className="bg-gray-100 p-4 rounded-lg shadow-md min-h-[300px] flex flex-col justify-between"
                      >
                        <div>
                          <h3 className="text-lg font-bold mb-4 text-center">
                            {column.title}
                          </h3>

                          <div className="flex flex-col gap-2 mb-4">
                            {column.tasks.length > 0 ? (
                              column.tasks.map((task, index) => (
                                // <div
                                //   key={index}
                                //   className="bg-white p-2 rounded-md shadow-sm border hover:shadow-md transition flex items-center justify-between"
                                // >
                                //   <span>{task}</span>
                                //   <button
                                //     onClick={() =>
                                //       handleDeleteTask(
                                //         kanban._id,
                                //         column.title,
                                //         task
                                //       )
                                //     }
                                //     className="text-red-500 hover:text-red-700 font-bold ml-2"
                                //     title="Xóa task"
                                //   >
                                //     -
                                //   </button>
                                // </div>
                                <div
                                  key={index}
                                  className="bg-white p-2 rounded-md shadow-sm border hover:shadow-md transition flex items-center justify-between relative"
                                >
                                  <span>{task}</span>

                                  <div className="flex gap-2 items-center">
                                    {/* Nút xóa task */}
                                    <button
                                      onClick={() =>
                                        handleDeleteTask(
                                          kanban._id,
                                          column.title,
                                          task
                                        )
                                      }
                                      className="text-red-500 hover:text-red-500 font-bold ml-2"
                                      title="Xóa task"
                                    >
                                      Xóa
                                    </button>

                                    {/* Nút move task */}
                                    <button
                                      onClick={() =>
                                        setMoveTaskData({
                                          kanbanId: kanban._id,
                                          fromColumn: column.title,
                                          task,
                                        })
                                      }
                                      className="text-blue-500 hover:text-blue-700 font-bold ml-2"
                                      title="Chuyển task"
                                    >
                                      ⇄
                                    </button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-gray-400 italic text-center">
                                Không có task
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Chỉ hiện form thêm task ở "To Do" */}
                        {isTodoColumn && (
                          <div>
                            <input
                              type="text"
                              placeholder="Thêm task mới..."
                              value={newTaskInput[key] || ""}
                              onChange={(e) =>
                                setNewTaskInput((prev) => ({
                                  ...prev,
                                  [key]: e.target.value,
                                }))
                              }
                              className="w-full p-2 border rounded-md mb-2"
                            />
                            <button
                              onClick={() =>
                                handleAddTask(kanban._id, column.title)
                              }
                              className="w-full bg-green-500 hover:bg-green-600 text-white py-1 rounded-md"
                            >
                              Gửi
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
};

export default Kanban;
