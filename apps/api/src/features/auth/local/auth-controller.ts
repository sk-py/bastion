import type { Request, Response } from "express";
import type { RegisterSchema } from "./auth-schema.js";
import { loginUser, registerUser } from "./auth-service.js";
import { env } from "../../../config.js";

export const register = async (req: Request, res: Response) => {
  const { name, email, password }: RegisterSchema = req.body;
  req.log.info("Registering user", { name, email });
  const user = await registerUser({ email, name, password });
  return res.status(201).json({ status: "success", data: user });
};

export const login = async (req: Request, res: Response) => {
  const { user, sessionToken } = await loginUser({
    ...req.body,
    ipAddress: req.ip,
    userAgent: req.get("User-Agent") ?? null,
  });

  console.log({
  sessionToken,
  length: sessionToken.length,
});

  res.cookie("session", sessionToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: env.AUTH_SESSION_TTL_MS,
  });

console.log(res.getHeaders());

  res.status(200).json({
    status: "success",
    data: user,
  });
};
