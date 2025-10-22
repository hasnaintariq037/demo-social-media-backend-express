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

  const pipeline: any[] = [];

  // Filter: posts from followed users
  if (isFollowingPosts === "true") {
    pipeline.push({
      $match: { author: { $in: req.user.following || [] } },
    });
  }

  // Add counts for likes and shares
  pipeline.push({
    $addFields: {
      likesCount: { $size: { $ifNull: ["$likes", []] } },
      sharesCount: { $size: { $ifNull: ["$shares", []] } },
    },
  });

  // Filter: only posts with at least one like
  if (isMostLikedPosts === "true") {
    pipeline.push({ $match: { likesCount: { $gt: 0 } } });
    pipeline.push({ $sort: { likesCount: -1, createdAt: -1 } });
  }

  // Filter: only posts with at least one share
  if (isMostSharedPosts === "true") {
    pipeline.push({ $match: { sharesCount: { $gt: 0 } } });
    pipeline.push({ $sort: { sharesCount: -1, createdAt: -1 } });
  }

  // If none of the above, default sorting
  if (!isMostLikedPosts && !isMostSharedPosts) {
    pipeline.push({ $sort: { createdAt: -1 } });
  }

  // Populate author
  pipeline.push({
    $lookup: {
      from: "users",
      localField: "author",
      foreignField: "_id",
      as: "author",
    },
  });
  pipeline.push({ $unwind: "$author" });

  // Populate original post and its author
  pipeline.push({
    $lookup: {
      from: "posts",
      localField: "originalPost",
      foreignField: "_id",
      as: "originalPost",
    },
  });
  pipeline.push({
    $unwind: { path: "$originalPost", preserveNullAndEmptyArrays: true },
  });
  pipeline.push({
    $lookup: {
      from: "users",
      localField: "originalPost.author",
      foreignField: "_id",
      as: "originalPost.author",
    },
  });

  const posts = await Post.aggregate(pipeline);
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

export const likePostService = async (req: Request) => {
  const { postId } = req.params;

  if (!req.user) throw new CustomError("Unauthorized", 401);

  const userId = new mongoose.Types.ObjectId(req.user._id as string);

  const post = await Post.findById(postId);
  if (!post) throw new CustomError("Post not found", 404);

  // Initialize likes array if undefined
  post.likes = post.likes || [];

  let message = "";

  if (post.likes.some((id) => id.equals(userId))) {
    // User already liked → unlike
    post.likes = post.likes.filter((id) => !id.equals(userId));
    message = "Unliked";
  } else {
    // Like the post
    post.likes.push(userId);
    message = "Liked";
  }

  await post.save({ validateBeforeSave: false });

  return message;
};
