import express from "express";
import type { Express } from "express";
import dotenv from "dotenv";
import Logger from "./core/logger.js";
import authRoutes from "./features/auth/local/auth-routes.js";
import serverRoutes from "./features/servers/server-routes.js";
import { accessLogMiddleware } from "./middleware/access-log.js";
import errorHandlerMiddleware from "./middleware/error-handler.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import cors from "cors";
import { connectToDatabase } from "./db/index.js";
import cookieParser from "cookie-parser";
dotenv.config();

const PORT = process.env.PORT || 3002;
const app: Express = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(requestIdMiddleware);
app.use(accessLogMiddleware);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/server", serverRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(errorHandlerMiddleware);

const bootstrap = async () => {
  await connectToDatabase();

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    Logger.info(`API server started on port ${PORT}`);
  });
};

bootstrap();

export default app;
