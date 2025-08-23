const multer = require("multer");
const path = require("path");

// Cấu hình nơi lưu ảnh
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // thư mục lưu ảnh
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // tên file: 16161616.png
  },
});

const upload = multer({ storage });

module.exports = upload;
