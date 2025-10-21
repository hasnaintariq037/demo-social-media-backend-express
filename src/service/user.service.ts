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
