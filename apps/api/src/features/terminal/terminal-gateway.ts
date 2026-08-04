import type { IncomingMessage } from "http";
import { WebSocketServer } from "ws";
import { parseCookie } from "cookie";
import { authenticateUser } from "../auth/local/auth-service.js";
import type { Duplex } from "node:stream";
import type WebSocket from "ws";
import logger from "src/core/logger.js";
import { URL } from "node:url";
import { createTerminalSession } from "./terminal-service.js";
import type { TerminalRequest } from "./terminal-types.js";
import UnAuthenticatedError from "src/core/errors/unauthenticated.js";

export class TerminalGateway {
  private readonly wss: WebSocketServer;

  constructor() {
    this.wss = new WebSocketServer({ noServer: true });

    this.wss.on("connection", this.handleConnection);
  }

  public handleUpgrade = async (
    request: IncomingMessage,
    socket: Duplex,
    head: Buffer,
  ) => {
    try {
      const user = await this.authenticate(request);

      (request as TerminalRequest).user = user;

      this.wss.handleUpgrade(request, socket, head, (ws) => {
        this.wss.emit("connection", ws, request);
      });
    } catch (error) {
      socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
      socket.destroy();
      logger.error({
        event: "terminal.error",
        error: (error as Error).message,
        userId: (request as TerminalRequest).user?.id,
      });
    }
  };

  private authenticate = async (request: IncomingMessage) => {
    const cookies = parseCookie(request.headers.cookie || "");

    const session = cookies["session"];

    if (!session) {
      throw new UnAuthenticatedError("Invalid session");
    }

    const { user } = await authenticateUser(session);
    return user;
  };

  private handleConnection = async (
    ws: WebSocket,
    request: TerminalRequest,
  ) => {
    const url = new URL(request.url || "", `http://${request.headers.host}`);
    const serverId = url.searchParams.get("serverId");

    if (!serverId) {
      ws.close(1008, "Missing serverId");
      return;
    }

    logger.info({
      event: "terminal.connected",
      userId: request.user.id,
      serverId,
    });

    try {
      const { stream, client } = await createTerminalSession(
        request.user.id,
        serverId,
      );

      ws.on("message", (message, isBinary) => {
        stream.write(isBinary ? message : message.toString());
      });

      stream.on("data", (chunk: Buffer) => {
        ws.send(chunk);
      });

      ws.on("close", () => {
        stream.close();
        client.end();

        logger.info({
          event: "terminal.disconnected",
          userId: request.user.id,
          serverId,
        });
      });

      stream.on("close", () => {
        client.end();
        if (ws.readyState === ws.OPEN) {
          ws.close(1000, "Terminal session closed");
        }
      });

      client.on("close", () => {
        if (ws.readyState === ws.OPEN) {
          ws.close(1000, "SSH client closed");
        }
      });

      ws.on("error", (error) => {
        logger.error({
          event: "terminal.error",
          userId: request.user.id,
          serverId,
          error: error.message,
        });
      });
    } catch (error) {
      logger.error({
        event: "terminal.session_failed",
        userId: request.user.id,
        serverId,
        error: (error as Error).message,
      });

      ws.close(1011, "Failed to create terminal session");
    }
  };
}
