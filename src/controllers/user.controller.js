import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

const registerUser=asyncHandler(async(req,res)=>{
     //get user details from frontend
     //validation- not empty
     //check if already exist : username,email
     //check for images,check for avatar
     //upload them to cloudinary,avatar
     //create user object--create entry in db
     //*****remove password and refresh token field from rsponse
     //check  for user creation
     //return response 

     const {fullName,username,email,password}=req.body
    

    if(
        [fullName,email,username,password].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400,"all fields are required")
    }

    const existedUser=sUser.findOne({
        $or:[{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409,"user already registered")
    }

    const avatarLocalPath=req.files?.avatar[0]?.path;

    const coverImageLocalpath=req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is required")
    }

    const avatar= await uploadOnCloudinary(avatarLocalPath)
    const coverImage=uploadOnCloudinary(coverImageLocalpath)

    if(!avatar){
        throw new ApiError(400,"avatar file is required")
    }

    const user=await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        username:username.toLowerCase(),
    });

    const createduser=await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createduser){
        throw new ApiError(500,"something went wrong while registering user")
    }

    return res.status(201).json(
        new ApiResponse(200,createduser,"user registered successfully")
    )





})

export {registerUser}