import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const JWT_EXPIRES_IN = "7d";

export interface JwtUserPayload extends JwtPayload {
  id: string;
}

export const generateToken = (userId: string) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): JwtUserPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtUserPayload;
  } catch (error) {
    return null;
  }
};
