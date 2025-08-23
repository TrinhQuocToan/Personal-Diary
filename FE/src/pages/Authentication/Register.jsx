import React, { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    gender: '',
    dob: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (
      !formData.username ||
      !formData.fullName ||
      !formData.email ||
      !formData.password ||
      !formData.gender ||
      !formData.dob
    ) {
      setError("Please fill in all required fields.");
      return;
    }


    try {
      const response = await axios.post("/api/register", formData);

      if (response.status === 201) {
        setSuccess('Registration successful!, will back to login page in 3 seconds');
        setError('');
        setTimeout(() => {
          setSuccess('');
          navigate('/login')
        }, 3000);
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.errors?.[0] || err.response?.data?.message || 'An error occurred. Please try again later.';
      console.log("Error from server:", err.response?.data);
      setError(errorMessage);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left Section */}
      <div className="w-1/2 bg-[#0b1c39] flex flex-col justify-center items-start px-20 text-white">
        <h1 className="text-4xl font-bold mb-6">Hello! Ready to tell a new story today?</h1>
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
          <h2 className="text-2xl font-bold text-gray-800 text-center" style={{ marginBottom: '20px' }}>Sign Up</h2>

          {/* Form */}
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <input
              type="text"
              name="username"
              placeholder="Username"
              className="border rounded px-4 py-2"
              value={formData.username}
              onChange={handleChange}
            />
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              className="border rounded px-4 py-2"
              value={formData.fullName}
              onChange={handleChange}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="border rounded px-4 py-2"
              value={formData.email}
              onChange={handleChange}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              className="border rounded px-4 py-2"
              value={formData.password}
              onChange={handleChange}
            />
            <select
              name="gender"
              className="border rounded px-4 py-2"
              value={formData.gender}
              onChange={handleChange}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="date"
              name="dob"
              className="border rounded px-4 py-2"
              value={formData.dob}
              onChange={handleChange}
            />

            <button
              type="submit"
              className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Sign Up
            </button>
          </form>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}

          <p className="text-center mt-6 text-sm text-gray-600">
            Already have an Account? <Link to="/login" className="text-blue-500 hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
