import { EventEmitter } from "node:events";
import { Client, type ClientChannel } from "ssh2";
import WebSocket from "ws";
import crypto from "crypto";

const SESSION_TIMEOUT_MS = 5 * 60 * 1000;
const SWEEPER_INTERVAL_MS = 60 * 1000;

export type SessionState = "active" | "closing" | "closed";

export interface SshSession {
  sessionId: string;
  userId: string;
  serverId: string;
  client: Client;
  shell: ClientChannel | null;
  ws: WebSocket | null;
  createdAt: number;
  lastActivity: number;
  state: SessionState;
  pendingOperations: Set<string>;
  outputBuffer: Buffer[];
  outputBufferSize: number;
}

export class SshSessionManager extends EventEmitter {
  private sessions = new Map<string, SshSession>();
  private sweeperInterval?: NodeJS.Timeout | undefined;
  private readonly MAX_BUFFER_BYTES = 128 * 1024; // 128KB

  public start(): void {
    if (this.sweeperInterval) return;
    this.sweeperInterval = setInterval(() => this.sweep(), SWEEPER_INTERVAL_MS);
  }

  public stop(): void {
    if (this.sweeperInterval) {
      clearInterval(this.sweeperInterval);
      this.sweeperInterval = undefined;
    }
  }

  public create(userId: string, serverId: string, client: Client): SshSession {
    const sessionId = crypto.randomUUID();

    const session: SshSession = {
      sessionId,
      userId,
      serverId,
      client,
      shell: null,
      ws: null,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      state: "active",
      pendingOperations: new Set(),
      outputBuffer: [],
      outputBufferSize: 0,
    };

    // Trap underlying SSH connection drops. Note: TerminalGateway registers its
    // own client "close"/"error" handlers per-connection and clears these via
    // removeAllListeners() before doing so (see gateway). That's intentional —
    // gateway's terminate()-based handlers are a strict superset of markClosing,
    // so nothing is lost, but it means these two listeners only ever really
    // apply in the brief window between create() and the first handleConnection
    // finishing setup. Not worth a bigger refactor to avoid that redundancy.
    client.on("close", () => this.markClosing(sessionId));
    client.on("error", () => this.markClosing(sessionId));

    this.sessions.set(sessionId, session);
    return session;
  }

  public appendOutput(sessionId: string, chunk: Buffer): void {
    const session = this.get(sessionId);
    if (!session) return;

    session.outputBuffer.push(chunk);
    session.outputBufferSize += chunk.length;

    while (
      session.outputBufferSize > this.MAX_BUFFER_BYTES &&
      session.outputBuffer.length > 0
    ) {
      const removed = session.outputBuffer.shift()!;
      session.outputBufferSize -= removed.length;
    }
  }

  public getBufferedOutput(sessionId: string): Buffer {
    const session = this.get(sessionId);
    if (!session || session.outputBuffer.length === 0) return Buffer.alloc(0);
    return Buffer.concat(session.outputBuffer);
  }

  public get(sessionId: string): SshSession | undefined {
    const session = this.sessions.get(sessionId);
    if (session && session.state !== "closed") {
      return session;
    }
    return undefined;
  }

  public findByServer(
    userId: string,
    serverId: string,
  ): SshSession | undefined {
    for (const session of this.sessions.values()) {
      if (
        session.userId === userId &&
        session.serverId === serverId &&
        session.state !== "closed"
      ) {
        return session;
      }
    }
    return undefined;
  }

  public touch(sessionId: string): void {
    const session = this.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
    }
  }

  /**
   * Reattaches a WebSocket to an existing session after a disconnect (e.g. mobile
   * lock/background/network handoff). Resets state back to "active" so the sweeper
   * doesn't reap a session the user just reconnected to.
   *
   * CALLER MUST CHECK OWNERSHIP FIRST. This method does not verify that the
   * caller's userId matches session.userId — sessionId is a bare UUID passable
   * over a WS query param, so skipping that check is a session-hijack hole.
   * See TerminalGateway.handleConnection for the required check via get().
   */
  public reattach(sessionId: string, ws: WebSocket): SshSession | undefined {
    const session = this.get(sessionId);
    if (!session) return undefined;

    session.state = "active";
    session.lastActivity = Date.now();
    session.ws = ws;
    return session;
  }

  public beginOperation(sessionId: string): string {
    const session = this.get(sessionId);
    if (!session) {
      throw new Error(
        `Cannot begin operation: Session ${sessionId} not found or closed`,
      );
    }

    const opId = crypto.randomUUID();
    session.pendingOperations.add(opId);
    return opId;
  }

  public endOperation(sessionId: string, opId: string): void {
    const session = this.get(sessionId);
    if (session) {
      session.pendingOperations.delete(opId);
    }
  }

  public markClosing(sessionId: string): void {
    const session = this.get(sessionId);
    if (session) {
      session.state = "closing";
      session.ws = null;
    }
  }

  public terminateByUser(userId: string): void {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.terminate(sessionId);
      }
    }
  }

  /**
   * Idempotent by construction: the map delete below means a second call for the
   * same sessionId hits `if (!session) return` and no-ops. That guarantees the
   * "terminated" event fires exactly once per session, regardless of which path
   * triggered it (shell close, client close/error, or sweeper timeout) — this is
   * the one signal downstream consumers (gateway, recording finalize) should rely on.
   */
  public terminate(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.state = "closed";

    if (session.shell) {
      session.shell.removeAllListeners();
      session.shell.end();
    }

    if (session.client) {
      session.client.removeAllListeners();
      session.client.end();
    }

    this.sessions.delete(sessionId);
    this.emit("terminated", session);
  }

  private sweep(): void {
    const now = Date.now();

    for (const [sessionId, session] of this.sessions.entries()) {
      if (
        session.state === "active" &&
        now - session.lastActivity > SESSION_TIMEOUT_MS
      ) {
        this.markClosing(sessionId);
      }

      if (session.state === "closing" && session.pendingOperations.size === 0) {
        this.terminate(sessionId);
      }
    }
  }
}

export const sshSessionManager = new SshSessionManager();
