const express = require('express');
const { userAuth } = require('../middlewares/auth');
const ConnectionRequestModel = require('../models/connectionRequest');
const User = require('../models/user'); // renamed to 'User' for consistency

const userRouter = express.Router();

const USER_SAFE_DATA = [
  "firstName",
  "lastName",
  "photoUrl",
  "age",
  "gender",
  "about",
  "skills",
  "emailId"
];

// GET /feed - users to show in feed excluding connections and requests
userRouter.get("/feed", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit;
    const pageSkip = (page - 1) * limit;

    // Find all connection requests (sent + received) for the user
    const connectionRequests = await ConnectionRequestModel.find({
      $or: [
        { fromUserId: loggedInUser._id },
        { toUserId: loggedInUser._id }
      ]
    }).select("fromUserId toUserId status");

    // Collect user IDs to hide from feed (connected or requested)
    const hideUsersFromFeed = new Set();
    connectionRequests.forEach(req => {
      hideUsersFromFeed.add(req.fromUserId.toString());
      hideUsersFromFeed.add(req.toUserId.toString());
    });

    // Find users excluding self and those in hideUsersFromFeed, select safe fields only
    const users = await User.find({
      $and: [
        { _id: { $ne: loggedInUser._id } },
        { _id: { $nin: Array.from(hideUsersFromFeed) } }
      ]
    })
      .select(USER_SAFE_DATA)
      .skip(pageSkip)
      .limit(limit);

    res.status(200).json({
      message: "All the users for feed",
      users
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

// GET /user/requests/received - pending connection requests
userRouter.get('/user/requests/received', userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const connectionRequests = await ConnectionRequestModel.find({
      toUserId: loggedInUser._id,
      status: "interested" // only interested requests
    })
      .populate("fromUserId", ["firstName", "emailId"]);

    res.status(200).json({
      message: "All the pending connection requests",
      connectionRequests
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

// GET /user/connections - accepted connections
userRouter.get('/user/connections', userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequestModel.find({
      $or: [
        { fromUserId: loggedInUser._id, status: "accepted" },
        { toUserId: loggedInUser._id, status: "accepted" }
      ]
    })
      .populate("fromUserId", ["firstName", "emailId"])
      .populate("toUserId", ["firstName", "emailId"]);

    if (connectionRequests.length === 0) {
      return res.status(404).json({
        message: "No connection found"
      });
    }

    // Map connections to include only the other user info as 'user'
    const data = connectionRequests.map(connection => {
      if (connection.fromUserId._id.toString() === loggedInUser._id.toString()) {
        return {
          ...connection._doc,
          user: connection.toUserId
        };
      } 
        return {
          ...connection._doc,
          user: connection.fromUserId
        };
      
    });

    res.status(200).json({
      message: "All the connections",
      data
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

module.exports = userRouter;
