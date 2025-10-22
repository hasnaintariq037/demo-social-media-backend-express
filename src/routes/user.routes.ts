import { Router } from "express";
import { validate } from "../middleware/validate.middleware";
import {
  loginController,
  registerController,
  logoutController,
  forgotPasswordController,
  resetPasswordController,
  updateProfileController,
  searchUserController,
  followUserController,
} from "../controller/user.controller";
import { loginSchema, signupSchema } from "../validation/yup.validationSchema";
import { authMiddlewqare } from "../middleware/auth.middleware";
import { upload } from "../middleware/multer.middleware";

const router = Router();

router.route("/register").post(validate(signupSchema), registerController);

router.route("/login").post(validate(loginSchema), loginController);

router.route("/logout").post(authMiddlewqare, logoutController);

router.route("/forgot-password").post(forgotPasswordController);

router.route("/reset-password/:token").post(resetPasswordController);

router
  .route("/update-profile")
  .put(
    authMiddlewqare,
    upload.single("profilePicture"),
    updateProfileController
  );

router.route("/search-user").get(authMiddlewqare, searchUserController);

router
  .route("/follow-user/:userId")
  .post(authMiddlewqare, followUserController);

export default router;
