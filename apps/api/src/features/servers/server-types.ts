import type z from "zod";
import type { updateServerSchema } from "./server-schema.js";

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
}


export type UpdateServerInput = z.infer<typeof updateServerSchema>;