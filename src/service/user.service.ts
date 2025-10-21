import { Request, Response } from "express";
import User from "../schema/user.schema";
import { generateToken } from "../utils/jwt.util";
import { sendEmail } from "../utils/nodemailer.util";
import crypto from "crypto";

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

// for forgot password
export const forgotPasswordService = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "invalid email" });
    }

    const resetToken = await user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const expiryTime = new Date(
      Date.now() + 2 * 60 * 1000
    ).toLocaleTimeString();

    const resetPasswordTemplate = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Password Reset Request</title>
    <style>
      body {
        font-family: 'Arial', sans-serif;
        background-color: #f4f6f8;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 30px auto;
        background: #ffffff;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }
      .header {
        text-align: center;
        border-bottom: 2px solid #007bff;
        padding-bottom: 10px;
        margin-bottom: 20px;
      }
      .header h2 {
        color: #007bff;
        margin: 0;
      }
      .content p {
        color: #555555;
        line-height: 1.6;
      }
      .button {
        display: block;
        width: fit-content;
        background-color: #007bff;
        color: white !important;
        text-decoration: none;
        padding: 12px 24px;
        border-radius: 6px;
        margin: 25px auto;
        text-align: center;
        font-weight: bold;
      }
      .footer {
        text-align: center;
        color: #888888;
        font-size: 13px;
        margin-top: 20px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h2>Reset Your Password</h2>
      </div>
      <div class="content">
        <p>Hello,</p>
        <p>
          We received a request to reset your password for your
          <strong>Social Media</strong> account. Click the button below to reset
          it. This link will expire at <strong>${expiryTime}</strong>.
        </p>
        <a href=${resetUrl} class="button">Reset Password</a>
        <p>
          If you didn’t request this, you can safely ignore this email. Your
          password will remain unchanged.
        </p>
      </div>
      <div class="footer">
        <p>© 2025 Social Media App. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
`;

    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      html: resetPasswordTemplate,
    });

    res
      .status(200)
      .json({ succeeded: true, message: "Email sent successfully" });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const resetPasswordService = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user by token and check expiry
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save({ validateBeforeSave: false });

    res.status(200).json({ message: "Password reset successful" });
  } catch (error: any) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error resetting password", error: error.message });
  }
};
