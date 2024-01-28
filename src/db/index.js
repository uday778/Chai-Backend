import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const dbconnect=async()=>{
    try{
       const connectionInstances= await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
       console.log(`\n mongodb connected !! db host:${connectionInstances.connection.host}`);
    }catch(err){
        console.log(" Mongo db connection failed",err)
        process.exit(1)
    }
}

export default dbconnect