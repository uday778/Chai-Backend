
import mongoose,{Schema} from "mongoose";

const subcriptionSchema= new Schema({
    subcriber:{
        type:Schema.Types.ObjectId, //one who is subcrbing
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId,//one whom "subscriber" is subcribing
        ref:"User"
    }
},
{
    timestamps:true
})

export const subcription= mongoose.model("Subcription",subcriptionSchema)