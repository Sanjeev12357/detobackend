const express = require("express");
const connectDB = require("./config/database");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const http=require("http");
const initializeSocket=require("./utils/socket");
const allowedOrigins = [
  "https://hinge-clone-indol.vercel.app",
  "https://hingeclone.onrender.com",
  "https://dateo.devexpertz.me",
  "https://luvshuv.devexpertz.me/",
  "http://localhost:5173"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
require('dotenv').config(); // Load environment variables


// IMPORTANT: Add raw body parser BEFORE JSON parser for webhook route
app.use('/webhook', express.raw({ type: 'application/json' }));

// Regular JSON parser for other routes
app.use(express.json());
app.use(cookieParser());
app.all("*", (req, res, next) => {
  console.log(`[ALL] ${req.method} ${req.originalUrl}`);
  next();
});

connectDB();

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const userRouter = require("./routes/user");
const requestRouter = require("./routes/request");
const paymentRouter = require("./routes/payment");
const chatRouter= require("./routes/chat");
const uploadRouter = require("./routes/upload");

app.use("/upload", uploadRouter);
app.use("/", authRouter);
app.use("/", profileRouter);
app.use('/', requestRouter);
app.use("/", userRouter);
app.use("/", paymentRouter);
app.use("/",  chatRouter);

const server = http.createServer(app);
initializeSocket(server);



app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: 'Your server is up and running on port 3000'
  });
});

server.listen(3000, () => {
  console.log("Server is successfully listening on port 3000...");
});