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
  completeInitialSetup as completeInitialSetupRepository,
  updateUser as updateUserRepository,
  updateUserStatus as updateUserStatusRepository,
} from "./auth-repository.js";
import type { LoginUserInput, User, UserRole } from "./auth-types.js";
import crypto from "crypto";
import { env } from "../../../config.js";
import UnAuthenticatedError from "../../../core/errors/unauthenticated.js";
interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  mustChangePassword: boolean;
  workspaceId: string;
}

export const toPublicUser = (user: User) => ({
  id: user.id,
  workspaceId: user.workspaceId,
  name: user.name,
  email: user.email,
  role: user.role,
  mustChangePassword: user.mustChangePassword,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const registerUser = async ({
  email,
  name,
  password,
  role,
  mustChangePassword,
  workspaceId,
}: RegisterUserInput) => {
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new BadRequestError("Email already exists");
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  const createdUser = await createUser({
    email,
    name,
    passwordHash,
    role,
    mustChangePassword,
    workspaceId,
  });

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

  const valid = await argon2.verify(user.passwordHash, password);

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

  const { passwordHash, ...publicUser } = user;

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

  if (!user.isActive) {
    throw new UnAuthenticatedError("Acocunt is disabled");
  }

  const { passwordHash, ...publicUser } = user;

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

export const completeInitialSetup = async ({
  userId,
  name,
  password,
}: {
  userId: string;
  name: string;
  password: string;
}) => {
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  const user = await completeInitialSetupRepository(userId, {
    name,
    passwordHash,
  });

  if (!user) {
    throw new BadRequestError("Initial setup is not available");
  }

  return toPublicUser(user);
};

export const updateUser = async (
  userId: string,
  workspaceId: string,
  data: {
    name: string;
    role: "admin" | "member";
    email: string;
    mustChangePassword: boolean;
  },
) => {
  const user = await updateUserRepository(userId, workspaceId, data);

  if (!user) {
    throw new BadRequestError("User not found.");
  }

  return toPublicUser(user);
};

export const updateUserStatus = async (
  userId: string,
  workspaceId: string,
  isActive: boolean,
) => {
  const user = await updateUserStatusRepository(userId, workspaceId, isActive);

  if (!user) {
    throw new BadRequestError("User not found.");
  }

  if (!isActive) {
    await deleteSessionsByUserId(userId);
  }

  return toPublicUser(user);
};

export type PublicUser = ReturnType<typeof toPublicUser>;
