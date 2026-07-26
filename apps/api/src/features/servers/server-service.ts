import NotFoundError from "../../core/errors/not-found.js";
import { encrypt } from "../../core/utils/encryption.js";
import {
  createNewServer,
  deleteServer,
  fetchAllServers,
  fetchServerById,
  updateServer,
} from "./server-repository.js";
import {
  type CreateServerSchema,
  type DeleteServerSchema,
  type UpdateServerSchema,
} from "./server-schema.js";
import type { Server, UpdateServerData } from "./server-types.js";

export const addServer = async (
  data: CreateServerSchema,
  userId: string,
): Promise<Server> => {
  const encryptedPassword =
    data.authMethod === "password" ? encrypt(data.password!) : null;
  const encryptedPrivateKey =
    data.authMethod == "private_key" ? encrypt(data.privateKey!) : null;
  const encryptedPassphrase = data.passphrase ? encrypt(data.passphrase) : null;

  const createdServer = await createNewServer(
    { ...data, encryptedPassword, encryptedPassphrase, encryptedPrivateKey },
    userId,
  );
  return createdServer;
};

export const getAllServers = async (userId: string): Promise<Server[]> => {
  const servers = await fetchAllServers(userId);
  return servers;
};

export const updateServerService = async (
  data: UpdateServerSchema,
  serverId: string,
  userId: string,
) => {
  const existingServer = await fetchServerById(serverId, userId);

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
  userId,
}: DeleteServerSchema) => {
  await deleteServer({ serverId, userId });
};
