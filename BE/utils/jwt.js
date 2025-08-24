const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();
const { JWT_SECRET } = process.env;

module.exports = {
  createAccessToken: async (data) => {
    return jwt.sign(data, JWT_SECRET, { expiresIn: "60d" });
  },

  verifyToken: async (token) => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      console.error("Lỗi xác thực token:", error.message);
      return null;
    }
  },

  createRefreshToken: async () => {
    return jwt.sign(
      { data: Math.random() + new Date().getTime() },
      JWT_SECRET,
      { expiresIn: "60d" }
    );
  },
};
