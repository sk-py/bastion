import express from "express";
import dotenv from "dotenv";
import Logger from "./core/logger.js";
import authRoutes from "./features/auth/local/auth-routes.js";
import { accessLogMiddleware } from "./middleware/access-log.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(accessLogMiddleware);
app.use(authRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  Logger.info(`API server started on port ${PORT}`);
});

export default app;
