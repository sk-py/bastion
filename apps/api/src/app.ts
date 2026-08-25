import express from "express";
import type { Express } from "express";
import dotenv from "dotenv";
import Logger from "./core/logger.js";
import authRoutes from "./features/auth/local/auth-routes.js";
import serverRoutes from "./features/servers/server-routes.js";
import terminalRoutes from "./features/terminal/terminal-routes.js";
import { accessLogMiddleware } from "./middleware/access-log.js";
import errorHandlerMiddleware from "./middleware/error-handler.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import cors from "cors";
import { connectToDatabase } from "./db/index.js";
import cookieParser from "cookie-parser";
import { env } from "./config.js";
import { createServer } from "http";
import { TerminalGateway } from "./features/terminal/terminal-gateway.js";
import { sshSessionManager } from "./core/ssh/ssh-session-manager.js";
import recordingRoutes from "./features/terminal/recording/recording-routes.js";
import { recordingService } from "./features/terminal/recording/recording-service.js";
import { initializeWorkspace } from "./core/bootstrap/workspace-setup.js";
import grouproutes from "./features/groups/group-routes.js";
import workspaceRoutes from "./features/workspaces/workspace-routes.js";
import dashboardRoutes from "./features/dashboard/dashboard-route.js";

dotenv.config();

const PORT = env.PORT || 3002;

const app: Express = express();
const httpServer = createServer(app);

const terminalGateway = new TerminalGateway();

httpServer.on("upgrade", (request, socket, head) => {
  if (request.url?.startsWith("/ws/terminal")) {
    terminalGateway.handleUpgrade(request, socket, head);
    return;
  }
  socket.destroy();
});

app.use(cors());
app.set("trust proxy", env.TRUST_PROXY);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(requestIdMiddleware);
app.use(accessLogMiddleware);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/server", serverRoutes);
app.use("/api/v1/terminal", terminalRoutes);
app.use("/api/v1/sessions", recordingRoutes);
app.use("/api/v1/groups", grouproutes);
app.use("/api/v1/workspace", workspaceRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(errorHandlerMiddleware);

const bootstrap = async () => {
  await connectToDatabase();
  await initializeWorkspace();
  await recordingService.sweepStuckRecordings();
  sshSessionManager.start();

  httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    Logger.info(`API server started on port ${PORT}`);
  });
};

bootstrap().catch((error) => {
  console.error("BOOTSTRAP FAILED:", error);
  process.exit(1);
});

export default app;
