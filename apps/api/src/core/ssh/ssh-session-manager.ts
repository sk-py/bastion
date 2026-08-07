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

export class SshSessionManager {
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
        
        // Trap underlying SSH connection drops
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
        
        while (session.outputBufferSize > this.MAX_BUFFER_BYTES && session.outputBuffer.length > 0) {
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

    public findByServer(userId: string, serverId: string): SshSession | undefined {
        for (const session of this.sessions.values()) {
            if (session.userId === userId && session.serverId === serverId && session.state !== "closed") {
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

    public beginOperation(sessionId: string): string {
        const session = this.get(sessionId);
        if (!session) {
            throw new Error(`Cannot begin operation: Session ${sessionId} not found or closed`);
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
    }

    private sweep(): void {
        const now = Date.now();

        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.state === "active" && (now - session.lastActivity > SESSION_TIMEOUT_MS)) {
                this.markClosing(sessionId);
            }

            if (session.state === "closing" && session.pendingOperations.size === 0) {
                this.terminate(sessionId);
            }
        }
    }
}

export const sshSessionManager = new SshSessionManager();