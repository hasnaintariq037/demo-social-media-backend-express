import { Router } from "express";
import { validate } from "../middleware/validate.middleware";
import { registerController } from "../controller/user.controller";
import { signupSchema } from "../validation/yup.validationSchema";

const router = Router();

router.route("/register").post(validate(signupSchema), registerController);

export default router;
