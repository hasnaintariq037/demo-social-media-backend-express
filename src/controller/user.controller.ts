import { Request, Response } from "express";
import { loginSerice, registerService } from "../service/user.service";

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
