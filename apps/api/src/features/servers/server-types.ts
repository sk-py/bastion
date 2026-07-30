import type z from "zod";
import type { updateServerSchema } from "@bastion/schemas";

export interface Server {
  id: string;
  userId: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authMethod: "password" | "private_key";
  encryptedPassword?: string | null;
  encryptedPrivateKey?: string | null;
  encryptedPassphrase?: string | null;
  hostname: string | null;
  operatingSystem: string | null;
  architecture: string | null;
  kernelVersion: string | null;
  sshVersion: string | null;
  cpuCoreCount: number | null;
  memoryTotalBytes: bigint | null;
  diskTotalBytes: bigint | null;
  hostFingerprint: string | null;
  lastConnectedAt: Date | null;
  discoveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServerData {
  name: string;
  host: string;
  port: number;
  username: string;
  authMethod: "password" | "private_key";
  encryptedPassword: string | null;
  encryptedPrivateKey: string | null;
  encryptedPassphrase: string | null;
}

export interface UpdateServerData {
  id: string;
  userId: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authMethod: "password" | "private_key";
  encryptedPassword: string | null;
  encryptedPrivateKey: string | null;
  encryptedPassphrase: string | null;
  hostname: string | null;
  operatingSystem: string | null;
  architecture: string | null;
  kernelVersion: string | null;
  sshVersion: string | null;
  cpuCoreCount: number | null;
  memoryTotalBytes: bigint | null;
  diskTotalBytes: bigint | null;
  hostFingerprint: string | null;
  lastConnectedAt: Date | null;
  discoveredAt: Date | null;
}

export type UpdateServerInput = z.infer<typeof updateServerSchema>;
