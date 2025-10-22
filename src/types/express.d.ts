import { User } from "../schema/user.schema";

declare global {
  namespace Express {
    interface Request {
      user?: User | null;
    }
  }
}
