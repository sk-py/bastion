import NotFoundError from "../../core/errors/not-found.js";
import pool from "../../db/pool.js";
import type { DeleteServerSchema } from "@bastion/schemas";
import type {
  CreateServerData,
  Server,
  UpdateServerData,
} from "./server-types.js";
import type { DiscoveredServerMetadata } from "src/core/ssh/ssh-types.js";

const SERVER_SELECT = `
  id,
  user_id AS "userId",
  name,
  host,
  port,
  username,
  auth_method AS "authMethod",
  hostname,
  operating_system AS "operatingSystem",
  architecture,
  kernel_version AS "kernelVersion",
  ssh_version AS "sshVersion",
  cpu_core_count AS "cpuCoreCount",
  memory_total_bytes AS "memoryTotalBytes",
  disk_total_bytes AS "diskTotalBytes",
  host_fingerprint AS "hostFingerprint",
  last_connected_at AS "lastConnectedAt",
  discovered_at AS "discoveredAt",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export const createNewServer = async (
  data: CreateServerData,
  userId: string,
): Promise<Server> => {
  const {
    authMethod,
    host,
    name,
    port,
    username,
    encryptedPassphrase,
    encryptedPassword,
    encryptedPrivateKey,
  } = data;
  const { rows } = await pool.query(
    `INSERT INTO servers (user_id, name, host, port, username, auth_method, encrypted_password, encrypted_private_key, encrypted_passphrase) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING ${SERVER_SELECT}`,
    [
      userId,
      name,
      host,
      port,
      username,
      authMethod,
      encryptedPassword,
      encryptedPrivateKey,
      encryptedPassphrase,
    ],
  );

  return rows[0]!;
};

export const fetchAllServers = async (userId: string): Promise<Server[]> => {
  const { rows } = await pool.query<Server>(
    `SELECT ${SERVER_SELECT} FROM servers WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return rows;
};

export const fetchServerById = async (
  serverId: string,
  userId: string,
): Promise<Server | null> => {
  const { rows } = await pool.query<Server>(
    `SELECT ${SERVER_SELECT},
    encrypted_password AS "encryptedPassword",
    encrypted_private_key AS "encryptedPrivateKey",
    encrypted_passphrase AS "encryptedPassphrase"
    FROM servers WHERE id = $1 AND user_id = $2`,
    [serverId, userId],
  );
  return rows[0] ?? null;
};

export const updateServer = async (dataToUpdate: UpdateServerData) => {
  const { rows } = await pool.query(
    `UPDATE servers SET name = $1, host = $2, port = $3, username = $4, auth_method = $5,  encrypted_password = $6, encrypted_private_key = $7, encrypted_passphrase = $8,
     hostname = $9,
      operating_system = $10,
      architecture = $11,
      kernel_version = $12,
      ssh_version = $13,
      cpu_core_count = $14,
      memory_total_bytes = $15,
      disk_total_bytes = $16,
      host_fingerprint = $17,
      last_connected_at = $18,
      discovered_at = $19,
      updated_at = NOW() WHERE id = $20 AND user_id = $21
   RETURNING ${SERVER_SELECT}`,
    [
      dataToUpdate.name,
      dataToUpdate.host,
      dataToUpdate.port,
      dataToUpdate.username,
      dataToUpdate.authMethod,
      dataToUpdate.encryptedPassword,
      dataToUpdate.encryptedPrivateKey,
      dataToUpdate.encryptedPassphrase,
      dataToUpdate.hostname,
      dataToUpdate.operatingSystem,
      dataToUpdate.architecture,
      dataToUpdate.kernelVersion,
      dataToUpdate.sshVersion,
      dataToUpdate.cpuCoreCount,
      dataToUpdate.memoryTotalBytes,
      dataToUpdate.diskTotalBytes,
      dataToUpdate.hostFingerprint,
      dataToUpdate.lastConnectedAt,
      dataToUpdate.discoveredAt,
      dataToUpdate.id,
      dataToUpdate.userId,
    ],
  );

  if (!rows[0]) {
    throw new NotFoundError("Server not found for this specific id");
  }

  return rows[0];
};

export const updateDiscovery = async (
  serverId: string,
  metadata: DiscoveredServerMetadata,
): Promise<Server> => {
  const {
    architecture,
    cpuCoreCount,
    discoveredAt,
    diskTotalBytes,
    hostFingerprint,
    hostname,
    kernelVersion,
    lastConnectedAt,
    memoryTotalBytes,
    operatingSystem,
    sshVersion,
  } = metadata;
  const { rows } = await pool.query(
    `UPDATE servers SET hostname = $2,
      operating_system = $3,
      architecture = $4,
      kernel_version = $5,
      ssh_version = $6,
      cpu_core_count = $7,
      memory_total_bytes = $8,
      disk_total_bytes = $9,
      host_fingerprint = $10,
      last_connected_at = $11,
      discovered_at = $12
  WHERE id = $1 RETURNING ${SERVER_SELECT}; ;`,
    [
      serverId,
      hostname,
      operatingSystem,
      architecture,
      kernelVersion,
      sshVersion,
      cpuCoreCount,
      memoryTotalBytes,
      diskTotalBytes,
      hostFingerprint,
      lastConnectedAt,
      discoveredAt,
    ],
  );

  return rows[0];
};

export const deleteServer = async (data: DeleteServerSchema): Promise<void> => {
  const { rowCount } = await pool.query(
    "DELETE FROM servers WHERE user_id = $1 AND id = $2 RETURNING *",
    [data.userId, data.serverId],
  );

  if (rowCount === 0) {
    throw new NotFoundError("Server not found for this specific id");
  }
};
