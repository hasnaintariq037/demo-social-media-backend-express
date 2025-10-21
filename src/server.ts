import app from "./app";
import dotenv from "dotenv";
import dbConnection from "./config/db";

dotenv.config();

const startServer = async () => {
  try {
    await dbConnection();
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
