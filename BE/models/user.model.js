const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    fullName: String,
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Male",
    },
    dob: {
      type: Date,
      required: [true, "Date of birth is required"],
      validate: {
        validator: function (value) {
          return /^\d{4}-\d{2}-\d{2}$/.test(
            value?.toISOString?.().split("T")[0]
          );
        },
        message: "Invalid date format. Use YYYY-MM-DD",
      },
    },
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: [4, "Username must be at least 4 characters"],
      unique: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      validate: [validator.isEmail, "Invalid email format"],
    },
    password: {
      type: String,
      required: true,
      minlength: [6, "Password must be at least 6 characters"],
    },
    mobileNumber: { type: String, default: "" },
    address1: { type: String, default: "" },
    country: { type: String, default: "" },
    avatar: { type: String, default: "" },
    otp: { type: String, default: null },
    otpExpiration: { type: Date, default: null },
    isVerified: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true, versionKey: false }
);

const User = mongoose.model("User", userSchema);
module.exports = User;