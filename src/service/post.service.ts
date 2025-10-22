import { Request } from "express";
import { uploadToCloudinary } from "../utils/cloudinary.util";
import Post from "../schema/post.schema";
import mongoose from "mongoose";
import { CustomError } from "../utils/customError.utils";
import { isPostOwner } from "../utils/checkPostOwner.util";

export const createPostService = async (req: Request) => {
  const { content } = req.body;
  const files = req.files as Express.Multer.File[] | undefined;

  let imageUrls: string[] = [];

  if (files && files.length > 0) {
    const uploadPromises = files.map((file) =>
      uploadToCloudinary(file.path, "posts")
    );
    const results = await Promise.all(uploadPromises);
    imageUrls = results.map((r) => r.secure_url);
  }

  // Create the post
  const post = await Post.create({
    content,
    images: imageUrls, // will be empty array if no images uploaded
    author: req.user?._id,
  });

  return post;
};

export const deletePostService = async (req: Request) => {
  const postId = req.params.postId;

  if (!req.user) throw new CustomError("Unauthorized", 401);
  const userId = new mongoose.Types.ObjectId(req.user._id as string);

  const post = await Post.findById(postId);

  if (!post) {
    throw new CustomError("Post not found", 404);
  }

  const isOwner = isPostOwner(userId, post);

  if (!isOwner) {
    throw new CustomError("Yuo are not owner of this post", 400);
  }

  const deletePost = await Post.deleteOne({ _id: postId });
  return deletePost;
};
