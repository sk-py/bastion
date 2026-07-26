import NotFoundError from "../../core/errors/not-found.js";
import pool from "../../db/pool.js";
import type { DeleteServerSchema } from "./server-schema.js";
import type {
  CreateServerData,
  Server,
  UpdateServerData,
} from "./server-types.js";

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
      RETURNING
       id,
       user_id AS "userId",
       name,
       host,
       port,
       username,
       auth_method AS "authMethod",
       created_at AS "createdAt",
       updated_at AS "updatedAt"`,
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
    `SELECT
       id,
       user_id AS "userId",
       name,
       host,
       port,
       username,
       auth_method AS "authMethod",
       created_at AS "createdAt",
       updated_at AS "updatedAt"
     FROM servers WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return rows;
};

export const fetchServerById = async (
  serverId: string,
  userId: string,
): Promise<Server | null> => {
  const { rows } = await pool.query<Server>(
    `SELECT
    id,
    user_id AS "userId",
    name,
    host,
    port,
    username,
    auth_method AS "authMethod",
    encrypted_password AS "encryptedPassword",
    encrypted_private_key AS "encryptedPrivateKey",
    encrypted_passphrase AS "encryptedPassphrase",
    created_at AS "createdAt",
    updated_at AS "updatedAt"
    FROM servers WHERE id = $1 AND user_id = $2`,
    [serverId, userId],
  );
  return rows[0] ?? null;
};

export const updateServer = async (dataToUpdate: UpdateServerData) => {
  const { rows } = await pool.query(
    `UPDATE servers SET name = $1, host = $2, port = $3, username = $4, auth_method = $5,  encrypted_password = $6, encrypted_private_key = $7, encrypted_passphrase = $8, updated_at = NOW() WHERE id = $9 AND user_id = $10
    RETURNING
    id,
    user_id AS "userId",
    name,
    host,
    port,
    username,
    auth_method AS "authMethod",
    created_at AS "createdAt",
    updated_at AS "updatedAt";`,
    [
      dataToUpdate.name,
      dataToUpdate.host,
      dataToUpdate.port,
      dataToUpdate.username,
      dataToUpdate.authMethod,
      dataToUpdate.encryptedPassword,
      dataToUpdate.encryptedPrivateKey,
      dataToUpdate.encryptedPassphrase,
      dataToUpdate.id,
      dataToUpdate.userId,
    ],
  );

  if (!rows[0]) {
    throw new NotFoundError("Server not found for this specific id");
  }

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
