import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";




const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        //save in db
        await user.save({ validateBeforeSave: false })


        return { accessToken, refreshToken }




    } catch (err) {
        throw new ApiError(500, "something wrong while generating refresh and access token")
    }
}


const registerUser = asyncHandler(async (req, res) => {
    //get user details from frontend
    //validation- not empty
    //check if already exist : username,email
    //check for images,check for avatar
    //upload them to cloudinary,avatar
    //create user object--create entry in db
    //*****remove password and refresh token field from rsponse
    //check  for user creation
    //return response 

    const { fullName, username, email, password } = req.body
    console.log("email:", email);


    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "all fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username },
        { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "user with email or usename already already exist")
    }
    console.log(req.files)

    //multer give access to files and multer give destination of file
    const avatarLocalPath = req.files?.avatar[0]?.path;

    // const coverImageLocalpath=req.files?.coverImage[0]?.path;
    let coverImageLocalpath
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalpath = req.files.coverImage[0].path
    }


    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file is required in localpath")
    }


    const avatar = await uploadOnCloudinary(avatarLocalPath);

    const coverImage = await uploadOnCloudinary(coverImageLocalpath);

    if (!avatar) {
        throw new ApiError(400, "avatar file is required sullle")
    }


    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase(),
        email,
        password
    });

    const createduser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createduser) {
        throw new ApiError(500, "something went wrong while registering user")
    }

    return res.status(201).json(
        new ApiResponse(200, createduser, "user registered successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    //req body-> data
    //username and email
    //find the user
    //password check
    //access and refresh token
    //send using cookie

    const { email, password, username } = req.body
    console.log(email)


    if (!(username || email)) {
        throw new ApiError(400, "username or password is required")
    }
    //here is an alternative of above code based on logic discussed  
    //if(!username && !email{
    // throw new ApiError(400,"username or password is required")
    // }
    //find user
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw new ApiError(404, "user does not exist ")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    console.log(isPasswordValid)
    // if(!isPasswordValid){
    //     throw new ApiError(401,"invalid user credentials")
    // }


    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options).json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                }
                , "user logged in successfully")
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    //clear cookies
    //reset refresh token
    //use middleware

    // we get access to user object using middleware
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: { refreshToken: 1 }//this removes the field from document
            
        },
        {
            //mongoose gives new updated document
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "user logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const { incommingrefreshToken } = req.cookies.refreshToken || req.body.refreshToken
    if (!incommingrefreshToken) {
        throw new ApiError(403, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incommingrefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "invcalid refresh token ")
        }

        if (incommingrefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true,
        }

        const { accessToken, newrefreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newrefreshTokenrefreshToken, options)
            .json(
                new ApiResponse(
                    2000,
                    { accessToken, newrefreshToken }
                )
            )
    } catch (error) {
        throw new ApiError(404, error?.message || "invalid refresh token")
    }



})

const changeCurrentpassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body
    //it used to confirm password
    if (!(newPassword === confirmPassword)) {

    }

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "invalid password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "password changed successfully")
        )

})


const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            req.user,
            "current user fetched successfully"))
})

const UpdateAccountdetails = asyncHandler(async (req, res) => {
    const { email, fullName } = req.body
    if (!fullName || !email) {
        throw new ApiError(400, "all fields are required ")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email,
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new ApiError(400, "error while uploading updatingavatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url,
            }
        },
        { new: true }
    ).select("-password")
    return res
        .status(200)
        .json(200, user, "avatar image updated successfully ")
})


const updateUsercoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "coverImage file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage.url) {
        throw new ApiError(400, "error while uploading ")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage.url,
            }
        },
        { new: true }
    ).select("-password")
    return res
        .status(200)
        .json(200, user, "coverimage updated successfully ")
})


const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params
    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "Subcription",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            }
        },
        {
            $lookup: {
                from: "Subcription",
                localField: "_id",
                foreignField: "subcriber",
                as: "subscribedTo",
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },

                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers. subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "user channel fetched successfully")
        )
})


const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id:new mongoose.objectId(req.user._id),
            }
        },
        {
            $lookup:{
                from:"Video",localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"User",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                   fullName:1,
                                   username:1,
                                   avatar:1,     
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner",
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res
    .status(200)
    .json(new ApiResponse(200, user[0].WatchHistory,"watchHistory fetched successfully"))
})



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentpassword,
    getCurrentUser,
    UpdateAccountdetails,
    updateUserAvatar,
    updateUsercoverImage,
    getUserChannelProfile,
    getWatchHistory,
}