import React, { useEffect, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FiSettings } from "react-icons/fi";
import { TooltipComponent } from "@syncfusion/ej2-react-popups";

import RegisterForm from "./pages/Authentication/Register";
import Login from "./pages/Authentication/Login";
import ForgotPassword from "./pages/Authentication/ForgotPassWord";
import VerifyOTP from "./pages/Authentication/VerifyOTP";
import ResetPassword from "./pages/Authentication/ResetPassword";

import {
  Navbar,
  Footer,
  Sidebar,
  ThemeSettings,
  UserProfile,
} from "./components";

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

  useEffect(() => {
    const currentThemeColor = localStorage.getItem("colorMode");
    const currentThemeMode = localStorage.getItem("themeMode");
    if (currentThemeColor && currentThemeMode) {
      setCurrentColor(currentThemeColor);
      setCurrentMode(currentThemeMode);
    }
  }, []);

  const { isAuthenticated } = useContext(AuthContext);

  const PrivateRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  return (
    <div className={currentMode === "Dark" ? "dark" : ""}>
      {" "}
      <BrowserRouter>
        {" "}
        <Routes>
          {" "}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <div className="dark:bg-main-dark-bg bg-main-bg min-h-screen w-full">
                  <AdminDashboard />
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                {" "}
                <div className="flex relative dark:bg-main-dark-bg">
                  {" "}
                  <div
                    className="fixed right-4 bottom-4"
                    style={{ zIndex: "1000" }}
                  >
                    <TooltipComponent content="Settings" position="Top">
                      {" "}
                      <button
                        type="button"
                        onClick={() => setThemeSettings(true)}
                        style={{
                          background: currentColor,
                          borderRadius: "50%",
                        }}
                        className="text-3xl text-white p-3 hover:drop-shadow-xl hover:bg-light-gray"
                      >
                        <FiSettings />
                      </button>
                    </TooltipComponent>
                  </div>
                  {activeMenu ? (
                    <div className="w-72 fixed sidebar dark:bg-secondary-dark-bg bg-white ">
                      <Sidebar />
                    </div>
                  ) : (
                    <div className="w-0 dark:bg-secondary-dark-bg">
                      <Sidebar />
                    </div>
                  )}
                  <div
                    className={
                      activeMenu
                          ? "dark:bg-main-dark-bg bg-main-bg min-h-screen md:ml-72 w-full"
                        : "bg-main-bg dark:bg-main-dark-bg w-full min-h-screen flex-2"
                    }
                  >
                    <div className="fixed md:static bg-main-bg dark:bg-main-dark-bg navbar w-full">
                      <Navbar />
                    </div>
                    <div>
                      {themeSettings && <ThemeSettings />}{" "}
                      <Routes>
                        {" "}
                        <Route path="/" element={<Notes />} />
                        <Route path="/note" element={<Notes />} />
                        <Route path="/profile" element={<UserProfilePage />} />
                      </Routes>
                    </div>
                    <Footer />
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
