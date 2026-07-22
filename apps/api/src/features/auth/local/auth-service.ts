import argon2 from "argon2";
import BadRequestError from "../../../core/errors/bad-request.js";
import { createUser, findUserByEmail } from "./auth-repository.js";
import type { User } from "./auth-types.js";
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
