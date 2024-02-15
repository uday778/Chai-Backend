import { Router } from "express";
import {
    loginUser,
    logoutUser,
    registerUser,
    refreshAccessToken,
    changeCurrentpassword,
    getCurrentUser,
    UpdateAccountdetails, updateUserAvatar, updateUsercoverImage, getUserChannelProfile, getWatchHistory
} from "../controllers/user.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post
    (
        upload.fields(
            [
                {
                    name: "avatar",
                    maxCount: 1
                },
                {
                    name: "coverImage",
                    maxCount: 1
                }
            ]),
        registerUser
    )

router.route("/login").post(loginUser)


//secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/chnage-password").post(verifyJWT, changeCurrentpassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, UpdateAccountdetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

router.route("/cover-image").patch(verifyJWT, upload.single("coverImage", updateUsercoverImage))


router.route("/c/:username").get(verifyJWT, getUserChannelProfile)

router.route("/history").get(verifyJWT, getWatchHistory)

export default router