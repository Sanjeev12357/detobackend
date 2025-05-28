const express = require("express");
const connectDB = require("./config/database");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");

const allowedOrigins = [
  "https://hinge-clone-indol.vercel.app",
  "https://hingeclone.onrender.com",
  "https://dateo.devexpertz.me",
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

// IMPORTANT: Add raw body parser BEFORE JSON parser for webhook route
app.use('/webhook', express.raw({ type: 'application/json' }));

// Regular JSON parser for other routes
app.use(express.json());
app.use(cookieParser());

connectDB();

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const userRouter = require("./routes/user");
const requestRouter = require("./routes/request");
const paymentRouter = require("./routes/payment");

app.use("/", authRouter);
app.use("/", profileRouter);
app.use('/', requestRouter);
app.use("/", userRouter);
app.use("/", paymentRouter);

app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: 'Your server is up and running on port 3000'
  });
});

app.listen(3000, () => {
  console.log("Server is successfully listening on port 3000...");
});