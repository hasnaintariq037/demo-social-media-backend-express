import express, { Application } from "express";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes";

const app: Application = express();

app.use(express.json());
app.use(cookieParser());
app.use("/user", userRoutes);

export default app;
