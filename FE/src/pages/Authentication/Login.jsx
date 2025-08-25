import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "./helper/axiosInstance";
import { AuthContext } from "../../AuthContext";

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});
  const { login } = useContext(AuthContext);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const validateForm = () => {
    const newErrors = {};
    const usernameRegex = /^[a-zA-Z0-9_]{4,}$/;
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!username || !usernameRegex.test(username)) {
      newErrors.username =
        "Username must be at least 4 characters and contain only letters, numbers, or underscores.";
    }
    if (!password || !passwordRegex.test(password)) {
      newErrors.password =
        "Password must be at least 8 characters, including one uppercase, one lowercase, one number, and one special character.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!validateForm()) {
      console.log("Form validation failed:", errors);
      return;
    }

    try {
      console.log("Attempting login with username:", username, "rememberMe:", rememberMe);
      const response = await axiosInstance.post("/api/login", {
        username,
        password,
        rememberMe,
      });
      console.log("Login response:", response);

      // Kiểm tra phản hồi 403 để yêu cầu OTP
      if (response.status === 403) {
        console.log("OTP required. Response data:", response.data);
        localStorage.setItem("verifyEmail", response.data.email);
        localStorage.setItem("rememberMe", JSON.stringify(response.data.rememberMe));
        localStorage.setItem(
          "otpMessage",
          response.data.message || "A new OTP has been sent to your email. Please verify to continue."
        );
        try {
          console.log("Navigating to /verify-otp");
          navigate("/verify-otp", { replace: true });
        } catch (navError) {
          console.error("Navigation error:", navError);
          setMessage({
            type: "error",
            text: "Failed to redirect to OTP verification page. Please try again.",
          });
        }
        return;
      }

      // Xử lý đăng nhập thành công
      console.log("Login successful. Response data:", response.data);
      setMessage({ type: "success", text: "Login successful! Welcome back." });
      login(response.data.accessToken, response.data.refreshToken, rememberMe);
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      // Xử lý lỗi từ server
      if (err.response?.status === 403) {
        console.log("OTP required (caught in error block). Response data:", err.response.data);
        localStorage.setItem("verifyEmail", err.response.data.email);
        localStorage.setItem("rememberMe", JSON.stringify(err.response.data.rememberMe));
        localStorage.setItem(
          "otpMessage",
          err.response.data.message || "A new OTP has been sent to your email. Please verify to continue."
        );
        try {
          console.log("Navigating to /verify-otp (error block)");
          navigate("/verify-otp", { replace: true });
        } catch (navError) {
          console.error("Navigation error:", navError);
          setMessage({
            type: "error",
            text: "Failed to redirect to OTP verification page. Please try again.",
          });
        }
        return;
      }
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          "Login failed. Please check your credentials.",
      });
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/2 bg-[#0b1c39] flex flex-col justify-center items-start px-20 text-white">
        <h1 className="text-4xl font-bold mb-6">
          Hello! Ready to tell a new story today?
        </h1>
        <p className="text-lg opacity-80">
          We’re glad to have you here. Let’s get started!
        </p>
      </div>
      <div className="w-1/2 bg-gray-100 flex flex-col justify-center items-center px-10 relative">
        {message && (
          <div
            className={`absolute top-6 px-6 py-3 rounded shadow-md transition-all duration-300 ${
              message.type === "success"
                ? "bg-green-100 text-green-800 border border-green-300"
                : "bg-red-100 text-red-800 border border-red-300"
            }`}
          >
            {message.text}
          </div>
        )}
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-5">
            Sign In
          </h2>
          <form className="flex flex-col gap-4" onSubmit={handleLogin}>
            <div>
              <input
                type="text"
                placeholder="Username"
                className="border rounded px-4 py-2 w-full"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErrors((prev) => ({ ...prev, username: "" }));
                }}
                required
              />
              {errors.username && (
                <p className="text-red-500 text-sm">{errors.username}</p>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="border rounded px-4 py-2 w-full"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: "" }));
                }}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-500 hover:underline"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password}</p>
              )}
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="rememberMe" className="text-sm text-gray-600">
                Remember Me
              </label>
            </div>
            <div className="flex justify-between items-center text-sm">
              <Link
                to="/forgot-password"
                className="text-blue-500 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white py-2 rounded mt-2 hover:bg-blue-600"
            >
              Sign In
            </button>
          </form>
          <p className="text-center mt-6 text-sm text-gray-600">
            <Link to="/register" className="text-blue-500 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;