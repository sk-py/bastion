import pool from "../../../db/pool.js";
import type {
  User,
  CreateUserInput,
  CreateSessionInput,
  Session,
} from "./auth-types.js";

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const { rows } = await pool.query<User>(
    "SELECT * FROM users WHERE email = $1 LIMIT 1",
    [email],
  );
  return rows[0] ?? null;
};

export const findUserById = async (id: string): Promise<User | null> => {
  const { rows } = await pool.query<User>(
    "SELECT * FROM users WHERE id = $1 LIMIT 1",
    [id],
  );
  return rows[0] ?? null;
};

export const createUser = async ({
  email,
  name,
  passwordHash,
}: CreateUserInput): Promise<User> => {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *`,
    [name, email, passwordHash],
  );
  return rows[0];
};

export const createSession = async ({
  expiresAt,
  ipAddress,
  lastUsedAt,
  sessionTokenHash,
  userAgent,
  userId,
}: CreateSessionInput): Promise<Session> => {
  const { rows } = await pool.query<Session>(
    `
      INSERT INTO auth_sessions (
      user_id,
      session_token_hash,
      expires_at,
      last_used_at,
      ip_address,
      user_agent )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
    [userId, sessionTokenHash, expiresAt, lastUsedAt, ipAddress, userAgent],
  );

  return rows[0]!;
};

export const findSessionByTokenHash = async (
  sessionTokenHash: string,
): Promise<Session | null> => {
  const { rows } = await pool.query<Session>(
    "SELECT * FROM auth_sessions WHERE session_token_hash = $1 LIMIT 1",
    [sessionTokenHash],
  );
  return rows[0] ?? null;
};

export const deleteSessionByTokenHash = async (
  sessionTokenHash: string,
): Promise<void> => {
  await pool.query(
    "DELETE FROM auth_sessions WHERE session_token_hash = $1",
    [sessionTokenHash],
  );
};

export const deleteSessionsByUserId = async (
  userId: string,
): Promise<void> => {
  await pool.query(
    "DELETE FROM auth_sessions WHERE user_id = $1",
    [userId],
  );
};