const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const connectDb = require("./config/db");
require("dotenv").config();
const userRouter = require("./routes/user.routes");
const calendarRoutes = require("./routes/calendar.routes");
const account = require("./routes/account.route");
const kanbanRoutes = require("./routes/kanban.route");
const diaryRoutes = require("./routes/note.routes");
const path = require("path");
const app = express();
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
// Initialize routes
app.use("/api", account);
app.use("/api/user", userRouter);
app.use("/api", calendarRoutes);
app.use("/api", kanbanRoutes);
app.use("/api", diaryRoutes);

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDb();

    const PORT = process.env.PORT || 9999;
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
