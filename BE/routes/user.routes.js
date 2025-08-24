const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Login route to authenticate user and set session
router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  // Simple user validation - in real app, use hashed passwords and proper validation
  const User = require("../models/user.model");
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    // For demo, assume password matches if password field equals 'password'
    if (password !== "password") {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    // Set userId in session
    req.session.userId = user._id.toString();
    return res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Route to get current logged-in user info from session
router.get("/current", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  try {
    const user = await require("../models/user.model").findById(
      req.session.userId
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// New route to get current user info using JWT auth middleware
router.get("/jwt-current", authMiddleware, async (req, res) => {
  try {
    const user = await require("../models/user.model").findById(req.account.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error("Get JWT current user error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/", userController.getAllUser);
router.get("/:id", userController.getUserById);

router.put("/:id", authMiddleware, userController.updateUser);
router.post(
  "/:id/avatar",
  authMiddleware,
  userController.uploadAvatarMiddleware,
  userController.uploadAvatar
);

module.exports = router;
