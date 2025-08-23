import React, { useState } from "react";
import axios from "axios";

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    rePassword: "",
    gender: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Dữ liệu đăng ký:", formData);

    registerUser(formData);
  };

  const registerUser = async (data) => {
    console.log("object", data);
    try {
      const params = {
        username: "trungdev",
        email: "tr111@gmail.com",
        password:"123456",
        name: "Trung Nguyễn",
        gender: "Male",
        dob: "2001-10-10"
      }
      const response = await axios.post(
        "http://localhost:9999/api/auth/register",
        params
      );
      console.log("Đăng ký thành công:", response.data);
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
          height: "100vh",
        }}
      >
        <h2>Register</h2>

        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ width: "100px", fontWeight: "600" }}>Username:</span>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            style={{
              height: "40px",
              width: "300px",
              borderRadius: "5px",
              padding: "15px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ width: "100px", fontWeight: "600" }}>Full Name:</span>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            style={{
              height: "40px",
              width: "300px",
              borderRadius: "5px",
              padding: "15px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ width: "100px", fontWeight: "600" }}>Email:</span>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{
              height: "40px",
              width: "300px",
              borderRadius: "5px",
              padding: "15px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ width: "100px", fontWeight: "600" }}>Password:</span>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{
              height: "40px",
              width: "300px",
              borderRadius: "5px",
              padding: "15px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ width: "100px", fontWeight: "600" }}>Password:</span>
          <input
            type="rePassword"
            name="rePassword"
            value={formData.password}
            onChange={handleChange}
            required
            style={{
              height: "40px",
              width: "300px",
              borderRadius: "5px",
              padding: "15px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ width: "100px", fontWeight: "600" }}>Sex:</span>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
          >
            <option value="">Chọn giới tính</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
            <option value="other">Khác</option>
          </select>
        </div>

        <button type="submit">Đăng ký</button>
      </div>
    </form>
  );
};

export default RegisterForm;
