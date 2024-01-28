// require('dotenv').config({path:'./env'});
import dotenv from 'dotenv'
import {app} from './app.js'
import dbconnect from "../src/db/index.js";
dotenv.config({path:'./.env'})

dbconnect()
.then(()=>{
    app.listen(process.env.PORT || 4000,()=>{
        console.log(`server is running on port ${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.log("Mongodb connection failed !! ",error);
})

/*
import {express} from "express";
const app= express();

;(async()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("error",error)
            throw error
        })
        app.listen(process.env.PORT,()=>{
            console.log(`app is listening on port: ${process.env.PORT}`)
        })
    }catch(error){
        console.error("error", error)
        throw error
    }
})()
*/