import { Request, Response, NextFunction } from "express";
import { CustomError } from "../utils/customError.utils";

export const errorMiddleware = (
  err: Error | CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof CustomError ? err.statusCode : 500;

  return res.status(statusCode).json({
    succeeded: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
