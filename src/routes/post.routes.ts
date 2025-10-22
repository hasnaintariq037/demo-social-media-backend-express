import { Router } from "express";
import { validate } from "../middleware/validate.middleware";
import { authMiddlewqare } from "../middleware/auth.middleware";
import { upload } from "../middleware/multer.middleware";
import {
  createPostController,
  deletePostController,
  getPostsController,
  sharePostController,
} from "../controller/post.controller";
import { createPostSchema } from "../validation/yup.validationSchema";

const router = Router();

router
  .route("/create-post")
  .post(
    authMiddlewqare,
    validate(createPostSchema),
    upload.array("images", 5),
    createPostController
  );

router
  .route("/delete-post/:postId")
  .delete(authMiddlewqare, deletePostController);

router.route("/get-posts").get(authMiddlewqare, getPostsController);

router.route("/share-post/:postId").post(authMiddlewqare, sharePostController);

export default router;
