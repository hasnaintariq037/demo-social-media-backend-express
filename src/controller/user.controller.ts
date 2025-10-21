import { Request, Response } from "express";
import {
  loginSerice,
  registerService,
  forgotPasswordService,
  resetPasswordService,
} from "../service/user.service";

export const registerController = (req: Request, res: Response) => {
  return registerService(req, res);
};

export const loginController = (req: Request, res: Response) => {
  return loginSerice(req, res);
};

export const logoutController = (req: Request, res: Response) => {
  res.clearCookie("accessToken");
  res.status(200).json({ succeeded: true, message: "user loged out" });
};

export const forgotPasswordController = (req: Request, res: Response) => {
  return forgotPasswordService(req, res);
};

export const resetPasswordController = (req: Request, res: Response) => {
  return resetPasswordService(req, res);
};
