const express=require("express");
const { userAuth } = require("../middlewares/auth");
const router=express.Router();
const razorpayInstance=require("../utils/razorpay");
const Payment=require("../models/payment");
const { validateWebhookSignature } = require("razorpay/dist/utils/razorpay-utils");
const User = require("../models/user");
router.post("/payment/create",userAuth,async(req,res)=>{
    try {
        const {firstName, lastName} = req.user;
        const order = await razorpayInstance.orders.create({
            "amount": 70000, // Amount in paise
            "currency": "INR",
            "receipt": "receipt#1",
            "notes":{
                firstName:firstName,
                lastName:lastName,
                emailId:req.user.emailId,
                memebershipType:"silver"
            }
        })

        // save it in my databse

        const payment=new Payment({
            orderId:order.id,
            amount:70000,
            currency:order.currency,
            status:order.status,
            paymentId:order.id,
            receipt:order.receipt,
            userId:req.user._id,
            notes:order.notes
        })

        const savedPayment=await payment.save();
        if(!savedPayment){
            return res.status(500).json({message:"Internal Server Error"});
        }

        //return backe my order details to frontned


        res.json({...savedPayment.toJSON()});
    } catch (error) {
        return res.status(500).json({message:"Internal Server Error",error:error.message}); 
    }
})

// verify the webhook signature

router.post("/payment/webhook",async(req,res)=>{
    try {
        const isWebhookValid = validateWebhookSignature(JSON.stringify(req.body), req.get('x-razorpay-signature'), "Sanju@123");

        if (!isWebhookValid) {
            return res.status(400).json({message:"Invalid Webhook Signature"});
        }
        //update my payment status in db
        const paymentDetails = req.body.payload.payment.entity;
        const payment=await Payment.findOne({orderId:paymentDetails.order_id});
        if(!payment){
            return res.status(404).json({message:"Payment not found"});
        }
        payment.status = paymentDetails.status;
        await payment.save();
        //update the user as premium
        // return succes response to razorpay
        const user=await User.findOne({_id:payment.userId})
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        user.isPremium=true;
        await user.save();
        console.log("User is now premium");
        // if(req.body.event === "payment.captured"){


        // }
        // if(req.body.event=="payment.failed"){
        // }

        return res.status(200).json({
    message: "Order created successfully",
    orderId: payment.orderId,
    amount: payment.amount,
    currency: payment.currency,
    receipt: payment.receipt
});
    } catch (error) {
        return res.status(500).json({message:"Internal Server Error",error:error.message});
    }
})




module.exports=router;
