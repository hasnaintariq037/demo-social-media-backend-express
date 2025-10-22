import { Request } from "express";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../utils/cloudinary.util";
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

  if (post.media && post.media.length > 0) {
    const deletePromises = post.media.map((imgUrl) => {
      // Extract publicId from URL (Cloudinary path)
      const parts = imgUrl.split("/");
      const fileName = parts[parts.length - 1];
      const publicId = `posts/${fileName.split(".")[0]}`;
      return deleteFromCloudinary(publicId);
    });
    await Promise.all(deletePromises);
  }

  const deletePost = await Post.deleteOne({ _id: postId });
  return deletePost;
};

export const getPostsService = async (req: Request) => {
  const { isMostLikedPosts, isFollowingPosts, isMostSharedPosts } = req.query;

  if (!req.user) throw new CustomError("Unauthorized", 401);

  let posts;

  const userId = new mongoose.Types.ObjectId(req.user._id as string);

  if (isFollowingPosts === "true") {
    posts = await Post.find({ author: { $in: req.user.following || [] } })
      .sort({ createdAt: -1 })
      .populate("author", "name profilePicture")
      .populate({
        path: "originalPost",
        populate: { path: "author", select: "name profilePicture" },
      });
  } else if (isMostLikedPosts === "true") {
    posts = await Post.find()
      .sort({ likes: -1, createdAt: -1 })
      .populate("author", "name profilePicture")
      .populate({
        path: "originalPost",
        populate: { path: "author", select: "name profilePicture" },
      });
  } else if (isMostSharedPosts === "true") {
    posts = await Post.aggregate([
      {
        $addFields: {
          sharesCount: { $size: { $ifNull: ["$shares", []] } },
        },
      },
      { $sort: { sharesCount: -1, createdAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },
      {
        $lookup: {
          from: "posts",
          localField: "originalPost",
          foreignField: "_id",
          as: "originalPost",
        },
      },
      { $unwind: { path: "$originalPost", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "originalPost.author",
          foreignField: "_id",
          as: "originalPost.author",
        },
      },
    ]);
  } else {
    posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("author", "name profilePicture")
      .populate({
        path: "originalPost",
        populate: { path: "author", select: "name profilePicture" },
      });
  }

  return posts;
};

export const sharePostService = async (req: Request) => {
  const { postId } = req.params;
  const { shareThoughts } = req.body;

  if (!req.user) throw new CustomError("Unauthorized", 401);

  const userId = new mongoose.Types.ObjectId(req.user._id as string);

  const originalPost = await Post.findById(postId);
  if (!originalPost) throw new CustomError("Post not found", 404);

  // Add current user to shares array if not already present
  if (!originalPost.shares.includes(userId)) {
    originalPost.shares.push(userId);
    await originalPost.save({ validateBeforeSave: false });
  }

  // Create a new post for the user feed
  const sharedPost = await Post.create({
    author: userId,
    content: originalPost.content,
    media: originalPost.media,
    originalPost: originalPost._id,
    shareThoughts: shareThoughts || "",
  });

  return sharedPost;
};
