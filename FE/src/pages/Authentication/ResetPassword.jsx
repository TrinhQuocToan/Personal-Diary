// ResetPassword.jsx (Updated to use POST instead of PUT)

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "./helper/axiosInstance";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check for valid session on component mount
  useEffect(() => {
    const storedEmail = localStorage.getItem("forgotPasswordEmail");
    console.log("Stored email in localStorage:", storedEmail); // Debug log
    if (!storedEmail) {
      setError("Session expired! Please request password reset again.");
      setTimeout(() => navigate("/forgot-password"), 3000);
    }
  }, [navigate]);

  const validatePassword = () => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!newPassword || !passwordRegex.test(newPassword)) {
      setError(
        "Password must be at least 8 characters, including one uppercase, one lowercase, one number, and one special character."
      );
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match!");
      return false;
    }
    return true;
  };

  const handleResetPassword = async () => {
    setError("");
    const storedEmail = localStorage.getItem("forgotPasswordEmail");
    console.log("Sending reset password request with:", {
      email: storedEmail,
      newPassword,
    }); // Debug log

    if (!storedEmail) {
      setError("Session expired! Please request password reset again.");
      setTimeout(() => navigate("/forgot-password"), 3000);
      return;
    }

    if (!validatePassword()) {
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post("/api/reset-password", {
        // Changed to post
        email: storedEmail,
        newPassword,
        confirmPassword,
      });
      console.log("Reset password response:", response.data); // Debug log

      localStorage.removeItem("forgotPasswordEmail");
      setError("");
      navigate("/login");
    } catch (error) {
      console.error("Reset password error:", error.response?.data); // Debug log
      const errorMessage =
        error.response?.status === 400
          ? error.response?.data?.message ||
            "Invalid input. Please check your password."
          : error.response?.status === 404
          ? "Account not found."
          : error.response?.status === 500
          ? "Server error. Please try again later."
          : "Something went wrong!";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex">
      <div className="w-1/2 bg-[#0b1d3a] text-white flex items-center justify-center flex-col px-16">
        <h2 className="text-4xl font-bold mb-4 leading-snug">
          Hello! Ready to tell a new story today?
        </h2>
        <p className="text-lg text-gray-300">
          We're glad to have you here. Let’s get started!
        </p>
      </div>

      <div className="w-1/2 bg-[#f5f6f8] flex items-center justify-center">
        <div className="w-full max-w-md bg-white p-10 rounded-xl shadow-lg">
          <div className="text-center mb-6">
            <div className="w-10 h-10 bg-blue-500 rounded-full mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
          </div>

          <p className="text-sm text-gray-500 text-center mb-4">
            Enter your new password below to reset it.
          </p>

          {error && (
            <div className="text-red-500 mb-3 text-sm text-center">{error}</div>
          )}

          <div className="mb-4 relative">
            <input
              type={showNewPassword ? "text" : "password"}
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setError("");
              }}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={loading}
            />
            <span
              className="absolute right-4 top-3.5 text-sm text-blue-500 cursor-pointer"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? "Hide" : "Show"}
            </span>
          </div>

          <div className="mb-6 relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={loading}
            />
            <span
              className="absolute right-4 top-3.5 text-sm text-blue-500 cursor-pointer"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </span>
          </div>

          <button
            onClick={handleResetPassword}
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold transition duration-300 ${
              loading
                ? "bg-blue-300 cursor-not-allowed text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          <p className="text-center text-sm text-blue-500 mt-6">
            Back to{" "}
            <a
              href="/login"
              className="underline font-medium hover:text-blue-700"
            >
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
