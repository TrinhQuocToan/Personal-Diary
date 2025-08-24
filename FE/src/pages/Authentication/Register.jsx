import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "./helper/axiosInstance";

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    gender: "",
    dob: "",
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const usernameRegex = /^[a-zA-Z0-9_]{4,}$/;
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!formData.username || !usernameRegex.test(formData.username)) {
      newErrors.username =
        "Username must be at least 4 characters and contain only letters, numbers, or underscores.";
    }
    if (!formData.fullName || formData.fullName.length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters.";
    }
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!formData.password || !passwordRegex.test(formData.password)) {
      newErrors.password =
        "Password must be at least 8 characters, including one uppercase, one lowercase, one number, and one special character.";
    }
    if (!formData.gender) {
      newErrors.gender = "Please select a gender.";
    }
    if (!formData.dob || !dobRegex.test(formData.dob)) {
      newErrors.dob = "Please enter a valid date of birth (YYYY-MM-DD).";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    try {
      const response = await axiosInstance.post("/api/register", formData);

      if (response.status === 201) {
        setSuccess(
          "Registration successful! Redirecting to login page in 3 seconds."
        );
        setErrors({});
        setTimeout(() => {
          setSuccess("");
          navigate("/login");
        }, 3000);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.errors?.[0] ||
        err.response?.data?.message ||
        "An error occurred. Please try again later.";
      setErrors({ general: errorMessage });
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left Section */}
      <div className="w-1/2 bg-[#0b1c39] flex flex-col justify-center items-start px-20 text-white">
        <h1 className="text-4xl font-bold mb-6">
          Hello! Ready to tell a new story today?
        </h1>
        <p className="text-lg text-white opacity-80">
          We’re glad to have you here. Let’s get started!
        </p>
      </div>

      {/* Right Section */}
      <div className="w-1/2 bg-gray-100 flex flex-col justify-center items-center px-10">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full" />
          </div>
          <h2
            className="text-2xl font-bold text-gray-800 text-center"
            style={{ marginBottom: "20px" }}
          >
            Sign Up
          </h2>

          {/* Form */}
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div>
              <input
                type="text"
                name="username"
                placeholder="Username"
                className="border rounded px-4 py-2 w-full"
                value={formData.username}
                onChange={handleChange}
              />
              {errors.username && (
                <p className="text-red-500 text-sm">{errors.username}</p>
              )}
            </div>
            <div>
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                className="border rounded px-4 py-2 w-full"
                value={formData.fullName}
                onChange={handleChange}
              />
              {errors.fullName && (
                <p className="text-red-500 text-sm">{errors.fullName}</p>
              )}
            </div>
            <div>
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="border rounded px-4 py-2 w-full"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
            </div>
            <div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                className="border rounded px-4 py-2 w-full"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password}</p>
              )}
            </div>
            <div>
              <select
                name="gender"
                className="border rounded px-4 py-2 w-full"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && (
                <p className="text-red-500 text-sm">{errors.gender}</p>
              )}
            </div>
            <div>
              <input
                type="date"
                name="dob"
                className="border rounded px-4 py-2 w-full"
                value={formData.dob}
                onChange={handleChange}
              />
              {errors.dob && (
                <p className="text-red-500 text-sm">{errors.dob}</p>
              )}
            </div>

            <button
              type="submit"
              className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Sign Up
            </button>
          </form>

          {errors.general && (
            <p className="text-red-500 text-sm mt-4">{errors.general}</p>
          )}
          {success && <p className="text-green-500 text-sm mt-4">{success}</p>}

          <p className="text-center mt-6 text-sm text-gray-600">
            Already have an Account?{" "}
            <Link to="/login" className="text-blue-500 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
