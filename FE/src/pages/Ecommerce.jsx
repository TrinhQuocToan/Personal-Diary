import React, { useEffect, useState } from "react";
import axiosInstance from "./Authentication/helper/axiosInstance";
import { PieChart, Pie, Cell,Tooltip,BarChart,Bar,XAxis,YAxis,
  CartesianGrid, ResponsiveContainer,Legend } from "recharts";

// Cập nhật mảng màu sắc với 4 màu khác nhau
const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7043"];

const Dashboard = () => {
  const [noteDataByDate, setNoteDataByDate] = useState([]);
  const [kanbanData, setKanbanData] = useState({
    todo: 0,
    inProgress: 0,
    done: 0,
    testing: 0,
  });
  const [calendarData, setCalendarData] = useState({ date: "", tasks: [] });

  useEffect(() => {
    fetchNoteCountByDate();
    fetchKanbanStats();
    fetchTomorrowCalendar();
  }, []);

  const fetchNoteCountByDate = async () => {
    try {
      const response = await axiosInstance.get("/api/dashboard/count-notes");
      setNoteDataByDate(response.data.notes);
    } catch (error) {
      console.error("Lỗi khi lấy số lượng ghi chú theo ngày:", error);
    }
  };

  const fetchKanbanStats = async () => {
    try {
      const response = await axiosInstance.get("/api/kanbanStats"); 
      setKanbanData(response.data); 
    } catch (error) {
      console.error("Lỗi khi lấy thống kê Kanban:", error);
    }
  };

  const fetchTomorrowCalendar = async () => {
    try {
      const res = await axiosInstance.get("/api/calendarTomorrow");
      const [year, month, day] = res?.data?.date?.split("-");

      const formattedDate = `${day}-${month}-${year}`;
      setCalendarData({ date: formattedDate, tasks: res?.data?.data });
    } catch (error) {
      console.error("Lỗi khi lấy công việc ngày mai:", error);
    }
  };

  const kanbanPieData = [
    { name: "To Do", value: kanbanData.todo },
    { name: "In Progress", value: kanbanData.inProgress },
    { name: "Done", value: kanbanData.done },
    { name: "Testing", value: kanbanData.testing },
  ];
  console.log("calendarData", calendarData);
  return (
    <div className="p-6 space-y-8">
      {/* Notes theo ngày */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Số lượng Ghi chú theo ngày</h2>
        {noteDataByDate.length === 0 ? (
          <p className="text-gray-500 text-center">Không có ghi chú nào.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={noteDataByDate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="count"
                name="Số lượng Notes"
                fill="#8884d8"
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Kanban Pie Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Công việc Kanban</h2>
        {kanbanPieData.every((item) => item.value === 0) ? (
          <p className="text-gray-500 text-center">
            Không có công việc Kanban nào.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={kanbanPieData} dataKey="value" nameKey="name"
                cx="50%" cy="50%" outerRadius={100} label>
                {kanbanPieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Calendar - Công việc ngày mai */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">
          Công việc ngày mai (
          {calendarData?.date ? calendarData?.date : "chưa có ngày nào"})
        </h2>
        {calendarData?.tasks?.length === 0 ? (
          <p className="text-gray-500">Không có công việc nào vào ngày mai.</p>
        ) : (
          <ul className="space-y-4">
            {calendarData?.tasks?.map((task, index) => (
              <li key={task._id} className="border-b pb-2">
                <h3 className="font-semibold text-lg">{task.title}</h3>
                {task.description && (
                  <p className="text-gray-600">{task.description}</p>
                )}
                <div className="text-sm text-gray-500">
                  <p>
                    Thời gian: {new Date(task.start).toLocaleTimeString()} -{" "}
                    {new Date(task.end).toLocaleTimeString()}
                  </p>
                  {task.location && <p>Địa điểm: {task.location}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
