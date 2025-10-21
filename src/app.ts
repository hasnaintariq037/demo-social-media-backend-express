import express, { Application } from "express";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes";
import { errorMiddleware } from "./middleware/error.middleware";

const app: Application = express();

app.use(express.json());
app.use(cookieParser());
app.use("/user", userRoutes);
app.use(errorMiddleware);

export default app;
