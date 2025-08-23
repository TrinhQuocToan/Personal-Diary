// app.js

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");

const productRouter = require("./routes/product");

const app = express();

// Set up mongoose connection

const mongoDB = process.env.MONGODB_URI;

mongoose.connect(mongoDB);
mongoose.Promise = global.Promise;

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Setup express-session middleware
app.use(
  session({
    secret: "your-secret-key", // replace with a strong secret in production
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // set secure: true if using https
  })
);

app.use("/product", productRouter);

const userRouter = require("./routes/user.routes");
app.use("/api/user", userRouter);

const port = 9999;

db.once("open", function () {
  console.log("Connected!");
  app.listen(port, () => {
    console.log("Server is up and running on port numner " + port);
  });
});
