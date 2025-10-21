import { Request, Response } from "express";
import User from "../schema/user.schema";
import { generateToken } from "../utils/jwt.util";

// for registration
export const registerService = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const isUserExists = await User.exists({ email });
    if (isUserExists) {
      throw new Error("user exists with this email");
    }

    const user = await User.create({ name, email, password });

    const token = generateToken(user._id as string);

    res.cookie("accessToken", token);

    return res
      .status(201)
      .json({ succeeded: true, message: "user registered" });
  } catch (error: any) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message,
      }));

      return res.status(400).json({ errors });
    }

    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// for login
export const loginSerice = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const isUserExists = await User.findOne({ email });
    if (!isUserExists) {
      throw new Error("Invalid email or password");
    }

    const isPasswordmatched = await isUserExists.comparePassword(password);
    if (!isPasswordmatched) {
      throw new Error("Invalid email or password");
    }

    const token = generateToken(isUserExists._id as string);

    res.cookie("accessToken", token);
    res.status(200).json({ succeeded: true, message: "user logged in" });
  } catch (error: any) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message,
      }));

      return res.status(400).json({ errors });
    }

    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
