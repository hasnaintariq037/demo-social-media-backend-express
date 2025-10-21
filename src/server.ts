import app from "./app";
import dotenv from "dotenv";

dotenv.config();

const startServer = () => {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
  });
};

startServer();
