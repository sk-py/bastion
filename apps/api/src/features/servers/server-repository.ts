import pool from "../../db/pool.js";
import type { CreateServerSchema } from "./server-schema.js";
import type { Server } from "./server-types.js";

export const createNewServer = async (
  data: CreateServerSchema,
  userId: string,
): Promise<Server> => {
  const {
    authMethod,
    host,
    name,
    port,
    username,
    passphrase,
    password,
    privateKey,
  } = data;
  const { rows } = await pool.query(
    "INSERT INTO servers (user_id, name, host, port, username, auth_method, password, private_key, passphrase) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
    [
      userId,
      name,
      host,
      port,
      username,
      authMethod,
      password,
      privateKey,
      passphrase,
    ],
  );

  return rows[0]!;
};
