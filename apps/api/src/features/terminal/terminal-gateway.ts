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
import type { RawData } from "ws";
import { recordServerConnection } from "../servers/server-service.js";
import { sshSessionManager } from "src/core/ssh/ssh-session-manager.js";

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

    const cols = parseInt(url.searchParams.get("cols") || "120", 10);
    const rows = parseInt(url.searchParams.get("rows") || "32", 10);

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
      const existingSessionId = url.searchParams.get("sessionId");
      let session = existingSessionId
        ? sshSessionManager.get(existingSessionId)
        : undefined;

      if (session && session.shell) {
        // Reattach to existing active connection
        logger.info({
          event: "terminal.reattached",
          userId: request.user.id,
          serverId,
        });
      } else {
        // Establish a brand new connection
        const { stream, client } = await createTerminalSession(
          request.user.id,
          serverId,
          { cols, rows },
        );
        await recordServerConnection(serverId, request.user.id);

        session = sshSessionManager.create(request.user.id, serverId, client);
        session.shell = stream;
      }

      session.ws = ws;

      // 1. Send the active ID to the frontend
      ws.send(
        JSON.stringify({ type: "session", sessionId: session.sessionId }),
      );

      // 2. Clean up any lingering data listeners from previous unmounted WebSockets
      session.shell.removeAllListeners("data");
      session.shell.removeAllListeners("close");

      // 3. Bind the active stream to the new WebSocket
      session.shell.on("data", (chunk: Buffer) => {
        if (ws.readyState === ws.OPEN) {
          ws.send(chunk);
        }
      });

      session.shell.on("close", () => {
        if (ws.readyState === ws.OPEN)
          ws.close(1000, "Terminal session closed");
      });

      // 4. Force a redraw of the Linux prompt so the screen isn't blank on reattachment
      if (existingSessionId) {
        session.shell.write("\r");
      }

      // -- The rest of your WS event handlers remain exactly the same --
      ws.on("message", (message: RawData, isBinary: boolean) => {
        sshSessionManager.touch(session!.sessionId);

        if (isBinary) {
          session!.shell?.write(message);
          return;
        }

        try {
          const payload = JSON.parse(message.toString());
          if (payload.type === "ping") {
            ws.send(
              JSON.stringify({ type: "pong", timestamp: payload.timestamp }),
            );
          } else if (payload.type === "resize") {
            session!.shell?.setWindow(
              payload.rows,
              payload.cols,
              payload.height || 0,
              payload.width || 0,
            );
          }
        } catch (error) {
          // ignore
        }
      });

      ws.on("close", () => {
        sshSessionManager.markClosing(session!.sessionId);
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
