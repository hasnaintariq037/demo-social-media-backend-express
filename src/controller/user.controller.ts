import { Request, Response } from "express";
import { registerService } from "../service/user.service";

export const registerController = (req: Request, res: Response) => {
  return registerService(req, res);
};
