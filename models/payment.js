const mongoose = require("mongoose");


const paymentSchema=new mongoose.Schema({
    paymentId:{
        type: String,
        
    },
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: "INR"
    },
    status: {
        type: String,
       
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    notes: {
        firstName: String,
        lastName: String,
        membershipType: String
    }
},{timestamps:true});


module.exports=  mongoose.model("Payment",paymentSchema);