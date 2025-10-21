import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt.util";
import User from "../schema/user.schema";

export const authMiddlewqare = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { accessToken } = req.cookies;

    if (!accessToken) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const decodedData = verifyToken(accessToken);
    if (!decodedData) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const user = await User.findById(decodedData.id);

    req.user = user;
    next();
  } catch (error: any) {
    throw new Error(error.message);
  }
};
