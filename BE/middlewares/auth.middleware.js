const mongoose = require("mongoose");
const { verifyToken } = require("../utils/jwt");
const User = require("../models/user.model");

module.exports = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization;
    console.log("Authorization Header:", authorizationHeader);

    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const token = authorizationHeader.split(" ")[1];
    console.log("Token:", token);

    const decoded = verifyToken(token, process.env.JWT_ACCESS_SECRET || 'your-access-secret-key');
    if (!decoded) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    console.log("Decoded token:", decoded);

    if (!decoded.id || !mongoose.Types.ObjectId.isValid(decoded.id)) {
      console.log("Invalid ID:", decoded?.id);
      return res.status(400).json({ message: "Token does not contain a valid ID" });
    }

    // Verify user exists in the database
    const user = await User.findById(decoded.id);
    if (!user) {
      console.log("User not found for ID:", decoded.id);
      return res.status(404).json({ message: "User not found" });
    }

    req.account = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    console.log("Error in middleware:", error.message);
    return res.status(401).json({ message: "Authentication error", error: error.message });
  }
};