const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const connectDb = require("./config/db");
require("dotenv").config();
const userRouter = require("./routes/user.routes");
const account = require("./routes/account.route");
const diaryRoutes = require("./routes/note.routes");
const adminRoutes = require("./routes/admin.routes");
const reportRoutes = require("./routes/report.routes");

const path = require("path");
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Middleware to handle CORS for uploaded files
app.use("/uploads", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
// WebSocket event handlers
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Join admin room
  socket.on('join-admin', () => {
    socket.join('admin-room');
    console.log('👑 Admin joined admin room');
  });

  // Join user room
  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`👤 User ${userId} joined user room`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Make io available globally
global.io = io;

// Initialize routes
app.use("/api", account);
app.use("/api/user", userRouter);
app.use("/api", diaryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportRoutes);

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDb();

    const PORT = process.env.PORT || 9999;
    httpServer.listen(PORT, () => {
      console.log(`✅ Server is running on port http://localhost:${PORT}`);
      console.log(`🔌 WebSocket server is ready`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
