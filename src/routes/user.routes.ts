import { Router } from "express";
import { validate } from "../middleware/validate.middleware";
import {
  loginController,
  registerController,
  logoutController,
} from "../controller/user.controller";
import { loginSchema, signupSchema } from "../validation/yup.validationSchema";
import { authMiddlewqare } from "../middleware/auth.middleware";

const router = Router();

router.route("/register").post(validate(signupSchema), registerController);

router.route("/login").post(validate(loginSchema), loginController);

router.route("/logout").post(authMiddlewqare, logoutController);

export default router;
