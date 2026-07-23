import argon2 from "argon2";
import BadRequestError from "../../../core/errors/bad-request.js";
import {
  createSession,
  createUser,
  deleteSessionByTokenHash,
  deleteSessionsByUserId,
  findSessionByTokenHash,
  findUserByEmail,
  findUserById,
} from "./auth-repository.js";
import type { LoginUserInput, User } from "./auth-types.js";
import crypto from "crypto";
import { env } from "../../../config.js";
import UnAuthenticatedError from "../../../core/errors/unauthenticated.js";
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
    throw new UnAuthenticatedError("Invalid credentials");
  }

  const valid = await argon2.verify(user.password_hash, password);

  if (!valid) {
    throw new UnAuthenticatedError("Invalid credentials");
  }

  const sessionToken = crypto.randomBytes(32).toString("base64url");

  const sessionTokenHash = crypto
    .createHash("sha256")
    .update(sessionToken)
    .digest("hex");

  const expiresAt = new Date(Date.now() + env.AUTH_SESSION_TTL_MS);

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

export const authenticateUser = async (sessionToken: string) => {
  const sessionTokenHash = crypto
    .createHash("sha256")
    .update(sessionToken)
    .digest("hex");

  const session = await findSessionByTokenHash(sessionTokenHash);

  if (!session) {
    throw new UnAuthenticatedError("Unauthorized");
  }

  if (session.expires_at < new Date()) {
    throw new UnAuthenticatedError("Session expired");
  }

  const user = await findUserById(session.user_id);

  if (!user) {
    throw new UnAuthenticatedError("Unauthorized");
  }

  if (!user.is_active) {
    throw new UnAuthenticatedError("Acocunt is disabled");
  }

  const { password_hash, ...publicUser } = user;

  return { user: publicUser, session };
};

export const logoutUser = async (sessionToken: string): Promise<void> => {
  const sessionTokenHash = crypto
    .createHash("sha256")
    .update(sessionToken)
    .digest("hex");

  await deleteSessionByTokenHash(sessionTokenHash);
};

export const logoutAllDevices = async (userId: string): Promise<void> => {
  await deleteSessionsByUserId(userId);
};