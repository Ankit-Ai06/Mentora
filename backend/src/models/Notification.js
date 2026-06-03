const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
{
    receiver:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

    type:{
        type:String,
        enum:[
            "connection_request",
            "request_accepted",
            "like",
            "comment",
            "share",
            "message"
        ]
    },

    text:{
        type:String
    },

    read:{
        type:Boolean,
        default:false
    }
},
{
    timestamps:true
}
);

module.exports =
mongoose.model(
    "Notification",
    notificationSchema
);
