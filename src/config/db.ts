import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const dbConnection = async (): Promise<void> => {
  try {
    if (!process.env.DB_URL) {
      throw new Error("DB_URL is not defined in environment variables");
    }
    await mongoose.connect(process.env.DB_URL);
    console.log("Database connected successfully");
  } catch (error: any) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1); // Exit process on failure
  }
};

export default dbConnection;
