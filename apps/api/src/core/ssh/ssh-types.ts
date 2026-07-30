import type { Client } from "ssh2";

export type SSHAuthMethod = "password" | "private_key";

export interface SSHConfig {
  host: string;
  port: number;
  username: string;

  authMethod: SSHAuthMethod;

  password: string | null;
  privateKey: string | null;
  passphrase: string | null;
}

export interface DiscoveredServerMetadata {
  hostname: string | null;
  operatingSystem: string | null;
  architecture: string | null;
  kernelVersion: string | null;
  sshVersion: string | null;
  cpuCoreCount: number | null;
  memoryTotalBytes: number | null;
  diskTotalBytes: number | null;
  hostFingerprint: string | null;
  lastConnectedAt: Date;
  discoveredAt: Date;
}

export type SSHConnection = {
  client: Client;
  hostFingerprint: string | null;
};