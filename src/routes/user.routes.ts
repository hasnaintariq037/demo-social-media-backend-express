import { Router } from "express";
import { validate } from "../middleware/validate.middleware";
import {
  loginController,
  registerController,
  logoutController,
  forgotPasswordController,
  resetPasswordController,
} from "../controller/user.controller";
import { loginSchema, signupSchema } from "../validation/yup.validationSchema";
import { authMiddlewqare } from "../middleware/auth.middleware";

const router = Router();

router.route("/register").post(validate(signupSchema), registerController);

router.route("/login").post(validate(loginSchema), loginController);

router.route("/logout").post(authMiddlewqare, logoutController);

router.route("/forgot-password").post(forgotPasswordController);

router.route("/reset-password/:token").post(resetPasswordController);

export default router;
