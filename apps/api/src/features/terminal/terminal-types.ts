import type { IncomingMessage } from "node:http";
import type { Client, ClientChannel } from "ssh2";
import type { PublicUser } from "../auth/local/auth-service.js";

export interface TerminalSession {
  stream: ClientChannel;
  client: Client;
}

export interface TerminalRequest extends IncomingMessage {
  user: PublicUser;
  authSessionId: string;
}

export interface TerminalOptions {
  cols: number;
  rows: number;
}
