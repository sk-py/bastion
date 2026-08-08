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
import {
  sshSessionManager,
  type SshSession,
} from "src/core/ssh/ssh-session-manager.js";
import { recordingService } from "./recording/recording-service.js";

export class TerminalGateway {
  private readonly wss: WebSocketServer;

  constructor() {
    this.wss = new WebSocketServer({ noServer: true });

    this.wss.on("connection", this.handleConnection);

    // Single, authoritative reaction to session death — fires exactly once per
    // session regardless of which path killed it (remote shell closed, SSH client
    // closed/errored, or the idle sweeper reaped it). Replaces the three inline
    // ws.close()+terminate() blocks that used to be duplicated per-connection below,
    // which is what let the sweeper path close a session without ever notifying
    // the frontend (listeners were stripped by terminate() before the ws.close()
    // that never got called).
    sshSessionManager.on("terminated", this.handleSessionTerminated);
  }

  private handleSessionTerminated = (session: SshSession) => {
    if (session.ws?.readyState === session.ws?.OPEN) {
      session.ws?.close(1000, "Session terminated");
    }
    void recordingService.finalize(session.sessionId);
  };

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

      let session: SshSession | undefined;

      if (existingSessionId) {
        // Ownership check BEFORE reattach — sessionId is a bare UUID over a query
        // param, so anyone who obtains another user's sessionId could otherwise
        // attach to their live shell. get() carries no owner check by itself.
        const candidate = sshSessionManager.get(existingSessionId);
        if (candidate && candidate.userId === request.user.id) {
          session = sshSessionManager.reattach(existingSessionId, ws);
        } else if (candidate) {
          logger.warn({
            event: "terminal.reattach_forbidden",
            userId: request.user.id,
            sessionId: existingSessionId,
          });
        }
      }

      if (session && session.shell) {
        // Reattach to existing active connection
        logger.info({
          event: "terminal.reattached",
          userId: request.user.id,
          serverId,
        });
      }

      if (!session) {
        // Establish a brand new connection
        const { stream, client } = await createTerminalSession(
          request.user.id,
          serverId,
          { cols, rows },
        );
        await recordServerConnection(serverId, request.user.id);

        session = sshSessionManager.create(request.user.id, serverId, client);
        session.shell = stream;
        void recordingService.startRecording(session, cols, rows);
      }

      session.ws = ws;

      // Send the active ID to the frontend
      ws.send(
        JSON.stringify({ type: "session", sessionId: session.sessionId }),
      );

      const buffered = sshSessionManager.getBufferedOutput(session.sessionId);
      if (buffered.length > 0) {
        ws.send(buffered);
      }

      // Clean up any lingering listeners from previous unmounted WebSockets before
      // re-registering below. This runs on every connection, new or reattached —
      // on a brand-new session it's a harmless no-op for shell (nothing registered
      // yet) and it does clear SshSessionManager's own create()-time markClosing
      // listeners on client. That's an accepted tradeoff, not an oversight: the
      // handlers re-registered right below call terminate(), which is a strict
      // superset of what markClosing does, so nothing is functionally lost — but
      // it's worth knowing this file owns client close/error handling from this
      // point forward, not the manager.
      session.shell?.removeAllListeners("data");
      session.shell?.removeAllListeners("close");
      session.client.removeAllListeners("close");
      session.client.removeAllListeners("error");

      // Capture live chunks into the chunked array
      session.shell?.on("data", (chunk: Buffer) => {
        sshSessionManager.appendOutput(session!.sessionId, chunk);
        recordingService.writeOutput(session!.sessionId, chunk);
        if (ws.readyState === ws.OPEN) {
          ws.send(chunk);
        }
      });

      session.shell?.on("close", () => {
        sshSessionManager.terminate(session!.sessionId);
      });

      // Also catch if the entire SSH client connection drops
      session.client.on("close", () => {
        sshSessionManager.terminate(session!.sessionId);
      });

      session.client.on("error", (err) => {
        logger.error({
          event: "ssh.client_error",
          error: err.message,
          serverId,
        });
        sshSessionManager.terminate(session!.sessionId);
      });

      // Force a redraw of the Linux prompt so the screen isn't blank on reattachment
      // if (existingSessionId) {
      //   session.shell.write("\r");  // Not required
      // }

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
            recordingService.writeResize(
              session!.sessionId,
              payload.cols,
              payload.rows,
            );
          } else if (payload.type === "disconnect") {
            // User-initiated kill it now without a fall back to markClosing()/sweeper,
            // that path exists for accidental drops we want to allow reattaching to.
            sshSessionManager.terminate(session!.sessionId);
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
