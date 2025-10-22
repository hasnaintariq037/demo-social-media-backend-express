import { Request } from "express";
import User from "../schema/user.schema";
import { generateToken } from "../utils/jwt.util";
import { sendEmail } from "../utils/nodemailer.util";
import crypto from "crypto";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../utils/cloudinary.util";
import { CustomError } from "../utils/customError.utils";
import mongoose from "mongoose";

export const registerService = async (req: Request) => {
  const { name, email, password } = req.body;
  const isUserExists = await User.exists({ email });
  if (isUserExists) throw new CustomError("User exists with this email", 400);
  const user = await User.create({ name, email, password });
  const token = generateToken(user._id as string);
  return { token, user };
};

export const loginSerice = async (req: Request) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new CustomError("Invalid email or password", 400);
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched)
    throw new CustomError("Invalid email or password", 400);
  const token = generateToken(user._id as string);
  return { token, user };
};

export const forgotPasswordService = async (req: Request) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new CustomError("Invalid email", 404);
  const resetToken = await user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString();

  const resetTemplate = `<p>Click below to reset your password. This link expires at ${expiryTime}</p>
    <a href="${resetUrl}">Reset Password</a>`;

  await sendEmail({
    to: user.email,
    subject: "Password Reset Request",
    html: resetTemplate,
  });

  return { resetUrl };
};

export const resetPasswordService = async (req: Request) => {
  const { token } = req.params;
  const { password } = req.body;
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) throw new CustomError("Invalid or expired reset token", 400);

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save({ validateBeforeSave: false });
  return { message: "Password reset successful" };
};

export const updateProfileService = async (req: Request) => {
  const userId = req.user?._id;
  const { name, email, bio } = req.body;
  const file = req.file;
  const user = await User.findById(userId);
  if (!user) throw new CustomError("User not found", 404);

  if (file) {
    if (user.profilePicture?.includes("cloudinary.com")) {
      const publicId = user.profilePicture.split("/").pop()?.split(".")[0];
      if (publicId) await deleteFromCloudinary(`profile_pictures/${publicId}`);
    }
    const uploaded = await uploadToCloudinary(file.path, "profile_pictures");
    user.profilePicture = uploaded.secure_url;
  }

  if (name) user.name = name;
  if (email) user.email = email;
  if (bio) user.bio = bio;

  await user.save({ validateBeforeSave: false });
  return user;
};

export const searchUserService = async (req: Request) => {
  const { name } = req.query;
  const users = await User.find({ name: { $regex: name, $options: "i" } });
  return users;
};

export const followUserService = async (req: Request) => {
  const targetUserId = req.params.userId;

  if (!req.user) throw new CustomError("Unauthorized", 401);

  // Convert current user ID to ObjectId
  const currentUserId = new mongoose.Types.ObjectId(req.user._id as string);

  if (currentUserId.equals(targetUserId)) {
    throw new CustomError("You cannot follow yourself", 400);
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) throw new CustomError("Target user not found", 404);

  const currentUser = await User.findById(currentUserId);
  if (!currentUser) throw new CustomError("Current user not found", 404);

  // Initialize arrays if undefined
  targetUser.followers = targetUser.followers || [];
  currentUser.following = currentUser.following || [];

  const alreadyFollowing = targetUser.followers.some((f) =>
    f.equals(currentUserId)
  );

  if (alreadyFollowing) {
    // UNFOLLOW
    targetUser.followers = targetUser.followers.filter(
      (f) => !f.equals(currentUserId)
    );
    currentUser.following = currentUser.following.filter(
      (f) => !f.equals(targetUserId)
    );

    await targetUser.save({ validateBeforeSave: false });
    await currentUser.save({ validateBeforeSave: false });

    return `You unfollow ${targetUser?.name}`;
  } else {
    // FOLLOW
    targetUser.followers.push(currentUserId);
    currentUser.following.push(new mongoose.Types.ObjectId(targetUserId));

    await targetUser.save({ validateBeforeSave: false });
    await currentUser.save({ validateBeforeSave: false });

    return `You follow ${targetUser?.name}`;
  }
};
