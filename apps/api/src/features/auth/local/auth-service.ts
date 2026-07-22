import argon2 from "argon2";
import BadRequestError from "../../../core/errors/bad-request.js";
import { createSession, createUser, findUserByEmail } from "./auth-repository.js";
import type { LoginUserInput, User } from "./auth-types.js";
import type { LoginSchema } from "./auth-schema.js";
import UnauthorizedError from "../../../core/errors/unauthorized.js";
import crypto from 'crypto'
import { env } from "../../../config.js";
interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export const toPublicUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  is_active: user.is_active,
  created_at: user.created_at,
  updated_at: user.updated_at,
});

export const registerUser = async ({
  email,
  name,
  password,
}: RegisterUserInput) => {
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new BadRequestError("Email already exists");
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  const createdUser = await createUser({ email, name, passwordHash });

  return toPublicUser(createdUser);
};


export const loginUser = async ({
  email,
  password,
  ipAddress,
  userAgent,
}: LoginUserInput) => {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const valid = await argon2.verify(
    user.password_hash,
    password,
  );

  if (!valid) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const sessionToken = crypto.randomBytes(32).toString("base64url");

  const sessionTokenHash = crypto
    .createHash("sha256")
    .update(sessionToken)
    .digest("hex");

  const expiresAt = new Date(
    Date.now() + env.AUTH_SESSION_TTL_MS,
  );

  await createSession({
    userId: user.id,
    sessionTokenHash,
    expiresAt,
    lastUsedAt: new Date(),
    ipAddress,
    userAgent,
  });

  const { password_hash, ...publicUser } = user;

  return {
    user: publicUser,
    sessionToken,
  };
};