const express=require("express");


const requestRouter=express.Router();
const ConnectionRequest=require("../models/connectionRequest");
const {userAuth}=require("../middlewares/auth");
const { Connection } = require("mongoose");
const user = require("../models/user");

requestRouter.post('/request/send/:status/:toUserId', userAuth, async (req, res) => {
  try {
          const fromUserId = req.user._id;
      const toUserId = req.params.toUserId;
      const status = req.params.status;

      const allowedStatus = ["ignored", "interested"];
      if (!allowedStatus.includes(status)) {
        return res
          .status(400)
          .json({ message: "Invalid status type: " + status });
      }

      const toUser = await user.findById(toUserId);
      if (!toUser) {
        return res.status(404).json({ message: "User not found!" });
      }

      const existingConnectionRequest = await ConnectionRequest.findOne({
        $or: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });
      if (existingConnectionRequest) {
        return res
          .status(400)
          .send({ message: "Connection Request Already Exists!!" });
      }

      const connectionRequest = new ConnectionRequest({
        fromUserId,
        toUserId,
        status,
      });

      const data = await connectionRequest.save();

      // const emailRes = await sendEmail.run(
      //   "A new friend request from " + req.user.firstName,
      //   req.user.firstName + " is " + status + " in " + toUser.firstName
      // );
      // console.log(emailRes);

      res.json({
        message:
          req.user.firstName + " is " + status + " in " + toUser.firstName,
        data,
      });
    // const fromUser = req.user._id;
    // const toUser = req.params.toUserId;
    // const status = req.params.status;

    // const allowedStatus = ["ignored", "interested"];
    // if (!allowedStatus.includes(status)) {
    //   return res.status(400).json({
    //     message: "Invalid status type: " + status,
    //   });
    // }
    

    // if (fromUser.toString() === toUser) {
    //   return res.status(400).json({
    //     message: "You cannot send request to yourself",
    //   });
    // }

    // const toUserExist = await user.findById(toUser);
    // if (!toUserExist) {
    //   return res.status(404).json({
    //     message: "User does not exist",
    //   });
    // }

    // const existingConnectionRequest = await ConnectionRequest.findOne({
    //   $or: [
    //     { fromUserId: fromUser, toUserId: toUser },
    //     { fromUserId: toUser, toUserId: fromUser },
    //   ],
    // });

    // if (existingConnectionRequest) {
    //   return res.status(400).json({
    //     message: "Connection request already exists",
    //   });
    // }

    // const connectionRequest = new ConnectionRequest({
    //   fromUserId: fromUser,
    //   toUserId: toUser,
    //   status: status,
    // });

    // const data = await connectionRequest.save();
    // res.json({
    //   message: `${req.user.firstName} is ${status} in ${toUserExist.firstName}`,
    //   data: data,
    // });
  } catch (err) {
    res.status(400).send("ERROR : " + err.message);
  }
});



requestRouter.post(
  "/request/review/:status/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const loggedInUser = req.user;
      const { status, requestId } = req.params;

      const allowedStatus = ["accepted", "rejected"];
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({ messaage: "Status not allowed!" });
      }

      const connectionRequest = await ConnectionRequest.findOne({
        _id: requestId,
        toUserId: loggedInUser._id,
        status: "interested",
      });
      if (!connectionRequest) {
        return res
          .status(404)
          .json({ message: "Connection request not found" });
      }

      connectionRequest.status = status;

      const data = await connectionRequest.save();

      res.json({ message: "Connection request " + status, data });
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
    }
  }
);


module.exports= requestRouter
