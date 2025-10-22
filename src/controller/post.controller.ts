import { NextFunction, Request, Response } from "express";
import {
  createPostService,
  deletePostService,
  getPostsService,
  sharePostService,
} from "../service/post.service";

export const createPostController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await createPostService(req);
    res.status(200).json({
      succeeded: true,
      message: "Post created successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePostController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await deletePostService(req);
    res
      .status(200)
      .json({ succeeded: true, message: "Post deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const getPostsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getPostsService(req);
    res.status(200).json({
      succeeded: true,
      message: "Posts fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const sharePostController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const sharePost = await sharePostService(req);
  res
    .status(200)
    .json({ succeeded: true, message: "Post shared successfully" });
};
