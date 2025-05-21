const express=require("express");


const requestRouter=express.Router();
const ConnectionRequest=require("../models/connectionRequest");
const {userAuth}=require("../middlewares/auth");
const { Connection } = require("mongoose");
const user = require("../models/user");

requestRouter.post('/request/send/:status/:toUserId',userAuth,async (req,res)=>{
try{
    const fromUser=req.user._id;
    const toUser=req.params.toUserId;
    const status=req.params.status;
    //console.log(toUser);

    const allowedStatus=["ignored","interested"];
    if(!allowedStatus.includes(status)){
       return res.status(400).json({
        message:"Invalid status type"+status
       })
    }
    if(fromUser===toUser){
        return res.status(400).json({
            message:"You cannot send request to yourself"
        })
    }

    const toUserExist=await user.findById({_id:toUser});
    if(!toUserExist){
        return res.status(404).json({
            message:"User does not exist"
        })
    }
    //if there is an exisiting connectio req
    const existingConnectionRequest =await ConnectionRequest.findOne({
       $or:[
        {fromUser,toUser},
        {
            fromUserId:toUser,toUserId:fromUser
        }
    ]
    })
    if(existingConnectionRequest){
        return res.status(400).json({
            message:"Connection request already  exist"
        })
    }
    const connectionRequest=new ConnectionRequest({
        fromUserId:fromUser,
        toUserId:toUser,
        status:status
    });
    const data=await connectionRequest.save();
    res.json({message:req.user.firstName+"is"+status+"in"+toUserExist.firstName,data:data});

}catch(err){
    res.status(400).send("ERROR : " + err.message);
}
})

requestRouter.post('/request/review/:status/:requestId',userAuth,async(req,res)=>{
    try{
        const loggedInUser=req.user._id;
        const requestId=req.params.requestId;
        const status=req.params.status

        const allowedStatus=["accepted","rejected"];
        if(!allowedStatus.includes(status)){
            return res.status(400).json({
                message:"Invalid status type"+status
            })
        }

        const connectionRequest=await ConnectionRequest.findOne({
            _id:requestId,
            toUserId:loggedInUser._id,
            status:"interested"

        });

        if(!connectionRequest){
            return res.status(404).json({
                message:"Connection request does not exist"
            })
        }

        connectionRequest.status=status;

        const data=await connectionRequest.save();
        res.json({message:"Request is"+status,data:data});

        

    }catch(err){
        res.status(400).send("ERROR : " + err.message);
    }

})

module.exports= requestRouter
