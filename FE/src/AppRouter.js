import React, { useEffect, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FiSettings } from "react-icons/fi";
import { TooltipComponent } from "@syncfusion/ej2-react-popups";

// Các trang Auth
import RegisterForm from "./pages/Authentication/Register";
import Login from "./pages/Authentication/Login";
import ForgotPassword from "./pages/Authentication/ForgotPassWord";
import VerifyOTP from "./pages/Authentication/VerifyOTP";
import ResetPassword from "./pages/Authentication/ResetPassword";

// Các layout component
import {
  Navbar,
  Footer,
  Sidebar,
  ThemeSettings,
  UserProfile,
} from "./components";

// Các trang khác
import {
  UserProfilePage,
  Notes,
} from "./pages";
import AdminDashboard from "./pages/AdminDashboard";

import "./App.css";
import { useStateContext } from "./contexts/ContextProvider";
import { AuthContext } from "./AuthContext";

const AppRouter = () => {
  const {
    setCurrentColor,
    setCurrentMode,
    currentMode,
    activeMenu,
    currentColor,
    themeSettings,
    setThemeSettings,
  } = useStateContext();

  // Lấy thông tin theme từ localStorage khi component được render lần đầu
  useEffect(() => {
    const currentThemeColor = localStorage.getItem("colorMode");
    const currentThemeMode = localStorage.getItem("themeMode");
    if (currentThemeColor && currentThemeMode) {
      setCurrentColor(currentThemeColor); // Đặt màu sắc hiện tại
      setCurrentMode(currentThemeMode); // Đặt chế độ theme (dark hoặc light)
    }
  }, []); // Chạy một lần khi component được mount

  const { isAuthenticated } = useContext(AuthContext); // Lấy thông tin đăng nhập từ AuthContext

  // Tạo component PrivateRoute để bảo vệ các route không cho phép truy cập nếu chưa đăng nhập
  const PrivateRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" />; // Nếu đã đăng nhập, hiển thị các trang con, nếu chưa thì redirect về trang login
  };

  return (
    <div className={currentMode === "Dark" ? "dark" : ""}>
      {" "}
      {/* Áp dụng class dark nếu mode là Dark */}
      <BrowserRouter>
        {" "}
        {/* Sử dụng Router để điều hướng trang */}
        <Routes>
          {" "}
          {/* Các route trong ứng dụng */}
          {/* Routes cho các trang Authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* Các route được bảo vệ, phải đăng nhập mới vào được */}
          <Route
            path="/admin" // Route cho admin dashboard
            element={
              <PrivateRoute>
                <div className="dark:bg-main-dark-bg bg-main-bg min-h-screen w-full">
                  <AdminDashboard />
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/*" // Các route phụ của ứng dụng
            element={
              <PrivateRoute>
                {" "}
                {/* Bảo vệ các route này bằng PrivateRoute */}
                <div className="flex relative dark:bg-main-dark-bg">
                  {" "}
                  {/* Giao diện chính với sidebar, navbar */}
                  <div
                    className="fixed right-4 bottom-4"
                    style={{ zIndex: "1000" }}
                  >
                    <TooltipComponent content="Settings" position="Top">
                      {" "}
                      {/* Tooltip cho nút Settings */}
                      <button
                        type="button"
                        onClick={() => setThemeSettings(true)} // Mở màn hình cài đặt theme khi click
                        style={{
                          background: currentColor,
                          borderRadius: "50%",
                        }}
                        className="text-3xl text-white p-3 hover:drop-shadow-xl hover:bg-light-gray"
                      >
                        <FiSettings /> {/* Icon Settings */}
                      </button>
                    </TooltipComponent>
                  </div>
                  {/* Sidebar */}
                  {activeMenu ? (
                    <div className="w-72 fixed sidebar dark:bg-secondary-dark-bg bg-white ">
                      <Sidebar />
                    </div>
                  ) : (
                    <div className="w-0 dark:bg-secondary-dark-bg">
                      <Sidebar />
                    </div>
                  )}
                  {/* Nội dung trang chính */}
                  <div
                    className={
                      activeMenu
                        ? "dark:bg-main-dark-bg bg-main-bg min-h-screen md:ml-72 w-full" // Nếu sidebar mở, có thêm margin-left
                        : "bg-main-bg dark:bg-main-dark-bg w-full min-h-screen flex-2"
                    }
                  >
                    {/* Navbar */}
                    <div className="fixed md:static bg-main-bg dark:bg-main-dark-bg navbar w-full">
                      <Navbar />
                    </div>
                    <div>
                      {themeSettings && <ThemeSettings />}{" "}
                      {/* Nếu mở cài đặt theme, hiển thị ThemeSettings */}
                      <Routes>
                        {" "}
                        {/* Các route của ứng dụng */}
                        {/* Các trang ứng dụng chính */}
                        <Route path="/" element={<Notes />} />
                        <Route path="/note" element={<Notes />} />
                        <Route path="/profile" element={<UserProfilePage />} />
                      </Routes>
                    </div>
                    <Footer /> {/* Footer */}
                  </div>
                </div>
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default AppRouter;
