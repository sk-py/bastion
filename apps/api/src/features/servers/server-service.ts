import NotFoundError from "../../core/errors/not-found.js";
import { discoverServer, testConnection } from "../../core/ssh/ssh-service.js";
import type { SSHConfig } from "../../core/ssh/ssh-types.js";
import { decrypt, encrypt } from "../../core/utils/encryption.js";
import {
  createNewServer,
  deleteServer,
  fetchAccessibleServerById,
  fetchAccessibleServers,
  fetchAllServers,
  fetchServerById,
  updateDiscovery,
  updateLastConnectedAt,
  updateServer,
} from "./server-repository.js";
import {
  type CreateServerSchema,
  type DeleteServerSchema,
  type UpdateServerSchema,
} from "@bastion/schemas";
import type { Server, UpdateServerData } from "./server-types.js";
import logger from "../../core/logger.js";
import type { UserRole } from "../auth/local/auth-types.js";

export const addServer = async (
  data: CreateServerSchema,
  userId: string,
  workspaceId: string,
): Promise<Server> => {
  const encryptedPassword =
    data.authMethod === "password" ? encrypt(data.password!) : null;
  const encryptedPrivateKey =
    data.authMethod == "private_key" ? encrypt(data.privateKey!) : null;
  const encryptedPassphrase = data.passphrase ? encrypt(data.passphrase) : null;

  const createdServer = await createNewServer(
    { ...data, encryptedPassword, encryptedPassphrase, encryptedPrivateKey },
    userId,
    workspaceId,
  );

  try {
    const metadata = await discoverServer({
      host: createdServer.host,
      port: createdServer.port,
      username: createdServer.username,
      authMethod: createdServer.authMethod,
      privateKey: data.privateKey!,
      password: data.password!,
      passphrase: data.passphrase!,
    });

    return await updateDiscovery(createdServer.id, metadata);
  } catch (error) {
    logger.warn("Server discovery failed", {
      serverId: createdServer.id,
      host: createdServer.host,
      error: error instanceof Error ? error.message : error,
    });
  }

  return createdServer;
};

export const getAllServers = async (
  userId: string,
  workspaceId: string,
  role: "owner" | "admin" | "member",
): Promise<Server[]> => {
  return getAccessibleServers(userId, workspaceId, role);
};

export const getServerById = async (
  serverId: string,
  userId: string,
  workspaceId: string,
  role: "owner" | "admin" | "member",
) => {
  return getAccessibleServer(userId, workspaceId, role, serverId);
};

export const updateServerService = async (
  data: UpdateServerSchema,
  serverId: string,
  userId: string,
  workspaceId: string,
  role: UserRole,
) => {
  const existingServer = await getServerById(
    serverId,
    userId,
    workspaceId,
    role,
  );

  if (!existingServer) {
    throw new NotFoundError("Server not found");
  }

  const serverToUpdate: UpdateServerData = {
    id: existingServer.id,

    userId: existingServer.userId,
    name: data.name ?? existingServer.name,
    host: data.host ?? existingServer.host,
    port: data.port ?? existingServer.port,
    username: data.username ?? existingServer.username,
    authMethod: data.authMethod ?? existingServer.authMethod,
    encryptedPassword: existingServer.encryptedPassword ?? null,
    encryptedPrivateKey: existingServer.encryptedPrivateKey ?? null,
    encryptedPassphrase: existingServer.encryptedPassphrase ?? null,
    hostname: existingServer.hostname ?? null,
    operatingSystem: existingServer.operatingSystem ?? null,
    architecture: existingServer.architecture ?? null,
    kernelVersion: existingServer.kernelVersion ?? null,
    sshVersion: existingServer.sshVersion ?? null,
    cpuCoreCount: existingServer.cpuCoreCount ?? null,
    memoryTotalBytes: existingServer.memoryTotalBytes ?? null,
    diskTotalBytes: existingServer.diskTotalBytes ?? null,
    hostFingerprint: existingServer.hostFingerprint ?? null,
    lastConnectedAt: existingServer.lastConnectedAt ?? null,
    discoveredAt: existingServer.discoveredAt ?? null,
  };

  if (serverToUpdate.authMethod === "password") {
    serverToUpdate.encryptedPrivateKey = null;
    serverToUpdate.encryptedPassphrase = null;
  }

  if (serverToUpdate.authMethod === "private_key") {
    serverToUpdate.encryptedPassword = null;
  }

  if (data.password) {
    serverToUpdate.encryptedPassword = encrypt(data.password);
  }

  if (data.privateKey) {
    serverToUpdate.encryptedPrivateKey = encrypt(data.privateKey);
  }

  if ("passphrase" in data) {
    serverToUpdate.encryptedPassphrase = data.passphrase
      ? encrypt(data.passphrase)
      : null;
  }

  const updatedServer = await updateServer(serverToUpdate);

  return updatedServer;
};

export const deleteServerById = async ({
  serverId,
  workspaceId,
}: DeleteServerSchema) => {
  await deleteServer({ serverId, workspaceId });
};

export const testServerConnection = async (
  serverId: string,
  userId: string,
  workspaceId: string,
  role: UserRole,
) => {
  const server = await getServerById(serverId, userId, workspaceId, role);

  interface DecryptedData {
    decryptedPassword?: string;
    decryptedPrivateKey?: string;
    decryptedPassphrase?: string;
  }

  let decryptedData: DecryptedData = {};

  if (!server) {
    throw new NotFoundError("Server not found for this specific id");
  }

  if (server.authMethod === "password") {
    decryptedData.decryptedPassword = decrypt(server.encryptedPassword!);
  } else {
    decryptedData.decryptedPrivateKey = decrypt(server.encryptedPrivateKey!);
    decryptedData.decryptedPassphrase = server.encryptedPassphrase
      ? decrypt(server.encryptedPassphrase)
      : "";
  }

  const sshConfig: SSHConfig = {
    authMethod: server.authMethod,
    host: server.host,
    port: server.port,
    username: server.username,
    password: decryptedData.decryptedPassword!,
    privateKey: decryptedData.decryptedPrivateKey!,
    passphrase: decryptedData.decryptedPassphrase!,
  };

  await testConnection(sshConfig);
};

export const recordServerConnection = async (
  serverId: string,
  userId: string,
): Promise<void> => {
  try {
    await updateLastConnectedAt(serverId, userId);
  } catch (error) {
    logger.error("Failed to update lastConnectedAt", {
      serverId,
      userId,
      error,
    });
  }
};

export const getAccessibleServer = async (
  userId: string,
  workspaceId: string,
  role: "owner" | "admin" | "member",
  serverId: string,
) => {
  const server = await fetchAccessibleServerById(
    serverId,
    userId,
    workspaceId,
    role,
  );

  if (!server) {
    throw new NotFoundError("Server not found");
  }

  return server;
};

export const getAccessibleServers = async (
  userId: string,
  workspaceId: string,
  role: "owner" | "admin" | "member",
) => {
  return fetchAccessibleServers(userId, workspaceId, role);
};
