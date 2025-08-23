// const jwt = require('jsonwebtoken');
// require('dotenv').config();

// const verifyToken = (req, res, next) => {
//   const authHeader = req.headers.authorization;

//   if (!authHeader || !authHeader.startsWith("Bearer")) {
//     return res.status(401).json({ message: "Không có token truy cập" });
//   }

//   const token = authHeader.split(" ")[1];

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded; // Gắn user id vào req.user
//     next();
//   } catch (error) {
//     return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
//   }
// };

// module.exports = verifyToken;

const mongoose = require("mongoose");
const { verifyToken } = require("../utils/jwt");

module.exports = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization;
    console.log("Authorization Header:", authorizationHeader);

    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not Login" });
    }

    const token = authorizationHeader.split(" ")[1];
    console.log("Token:", token);

    const decoded = await verifyToken(token);
    if (!decoded) {
      return res
        .status(403)
        .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    console.log("Decoded token:", decoded);

    if (!decoded.id || !mongoose.Types.ObjectId.isValid(decoded.id)) {
      console.log("ID không hợp lệ:", decoded?.id);
      return res.status(400).json({ message: "Token không chứa ID hợp lệ" });
    }

    req.account = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    console.log("Lỗi trong middleware:", error.message);
    return res
      .status(401)
      .json({ message: "Lỗi xác thực", error: error.message });
  }
};
