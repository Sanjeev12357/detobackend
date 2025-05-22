const express = require("express");
const connectDB = require("./config/database");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");




app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

connectDB()
 
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");

const userRouter = require("./routes/user");
const requestRouter = require("./routes/request");

app.use("/", authRouter);
app.use("/", profileRouter);
app.use('/',requestRouter);
app.use("/", userRouter);



app.get("/", (req, res) => {
	return res.json({
		success:true,
		message:'Your server is up and running on port 3000'
	});
});
  app.listen(3000, () => {
      console.log("Server is successfully listening on port 3000...");
    });
