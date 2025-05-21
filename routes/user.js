const express=require('express');
const { userAuth } = require('../middlewares/auth');
const ConnectionRequestModel = require('../models/connectionRequest');
const { connection } = require('mongoose');
const user = require('../models/user');

const userRouter=express.Router();



userRouter.get("/feed",userAuth,async(req,res)=>{
    try {
        //user should see all the user cards except 
        //0. his own card
        //1. user with whom he is already connected
        //2. user to whom he has sent request
        //3. ignored somebody

        const loggedInUser=req.user;
        const page=parseInt(req.query.page)||1;
        let limit=parseInt(req.query.limit)||10;
        limit=limit>50?50:limit;

        const pageSkip=(page-1)*limit;
        // find all connection requests (sent +recieved)
        const connectionRequests=await ConnectionRequestModel.find({
            $or:[
                {fromUserId:loggedInUser._id},
                {toUserId:loggedInUser._id}
            ]
        }).select("fromUserId toUserId status");

        const hideUsersFromFeed=new Set();
        connectionRequests.forEach(req=>{
            hideUsersFromFeed.add(req.fromUserId.toString());
            hideUsersFromFeed.add(req.toUserId.toString());
        })

        const users=await user.find({
            $and:[
                {_id:{$ne:loggedInUser._id}},
                {_id:{$nin:[...hideUsersFromFeed]}}
            ]
        }).skip(pageSkip).limit(limit);

        res.send({
            message:"All the users for feed",
            users
        })
        
    } catch (error) {
        res.status(500).json({
            message:error.message
        })
    }
})


// Get all the pending connection request for the loggedIn user
userRouter.get('/user/requests/recieved',userAuth,async(req,res)=>{
    try{
        const loggedInUser=req.user;
        const connectionRequests=await ConnectionRequestModel.find({
            toUserId:loggedInUser._id,
            status:"interested" // only get the interested connection request
        })
        .populate("fromUserId",["firstName", "emailId"]);
        res.status(200).json({
            message:"All the pending connection request",
            connectionRequests
        })
    }
    catch(error){
        res.status(500).json({
            message:error.message
        })
    }
})

userRouter.get('/user/connections',userAuth,async(req,res)=>{ 
    
    try {
        const loggedInUser=req.user;

        const connectionRequests=await ConnectionRequestModel.find({
            $or:[
                {fromUserId:loggedInUser._id,status:"accepted"},
                {toUserId:loggedInUser._id,status:"accepted"}
            ]
        })
        .populate("fromUserId",["firstName","emailId"]).populate("toUserId",["firstName","emailId"]);

        if(!connectionRequests){
            return res.status(404).json({
                message:"No connection found"
            })
        }
        const data=connectionRequests.map((connection)=>{
            if(connection.fromUserId._id.toString()===loggedInUser._id.toString()){
                return {
                    ...connection._doc,
                    user:connection.toUserId
                }
            }
            else{
                return {
                    ...connection._doc,
                    user:connection.fromUserId
                }
            }
        })
        res.status(200).json({
            message:"All the connections",
            data:connectionRequests
        })   
    } catch (error) {
        res.status(500).json({
            message:error.message
        })

    }
})

module.exports=userRouter;