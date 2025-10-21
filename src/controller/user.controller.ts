import { Request, Response, NextFunction } from "express";
import {
  loginSerice,
  registerService,
  forgotPasswordService,
  resetPasswordService,
  updateProfileService,
} from "../service/user.service";

export const registerController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, user } = await registerService(req);
    res.cookie("accessToken", token);
    res
      .status(201)
      .json({ succeeded: true, message: "User registered", data: user });
  } catch (error) {
    next(error);
  }
};

export const loginController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, user } = await loginSerice(req);
    res.cookie("accessToken", token);
    res
      .status(200)
      .json({ succeeded: true, message: "User logged in", data: user });
  } catch (error) {
    next(error);
  }
};

export const logoutController = (req: Request, res: Response) => {
  res.clearCookie("accessToken");
  res.status(200).json({ succeeded: true, message: "User logged out" });
};

export const forgotPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await forgotPasswordService(req);
    res.status(200).json({
      succeeded: true,
      message: "Password reset email sent",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await resetPasswordService(req);
    res.status(200).json({
      succeeded: true,
      message: "Password reset successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfileController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await updateProfileService(req);
    res.status(200).json({
      succeeded: true,
      message: "Profile updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
