const mongoose=require('mongoose')

    const conectiopnRequestSchema=new mongoose.Schema({
        fromUserId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },
        toUserId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,  
        },
        status:{
            type:String,

            enum:["ignore","interested","accepted","rejected"],
            default:"ignore"
        }
    
    },{
        timestamps:true 
    });

    conectiopnRequestSchema.index({fromUserId:1,toUserId:1},{unique:true});
    conectiopnRequestSchema.pre("save",function(next){
        const conectionrequest=this;
        // check if the from user id is same as touserid
        if(this.fromUserId===this.toUserId){
            throw new Error("You cannot send request to yourself")
        }
        next();
    })


    const ConnectionRequestModel=new mongoose.model('connectionRequest',conectiopnRequestSchema)
    module.exports=ConnectionRequestModel;