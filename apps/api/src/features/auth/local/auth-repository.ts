import pool from "../../../db/pool.js";
import type { User, CreateUserInput } from "./auth-types.js";

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
