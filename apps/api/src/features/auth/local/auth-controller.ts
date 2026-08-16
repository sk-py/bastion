import type { Request, Response } from "express";
import type { AddUserSchema } from "@bastion/schemas";
import {
  loginUser,
  logoutAllDevices,
  logoutUser,
  registerUser,
  completeInitialSetup as completeInitialSetupService,
} from "./auth-service.js";
import { env } from "src/config.js";

export const addUser = async (req: Request, res: Response) => {
  const { name, email, password, role, mustChangePassword }: AddUserSchema =
    req.body;
  req.log.info("Registering user", { name, email, role, mustChangePassword });
  const user = await registerUser({
    email,
    name,
    password,
    role,
    mustChangePassword,
    workspaceId: req.user.workspaceId,
  });
  return res.status(201).json({ status: "success", data: user });
};

export const login = async (req: Request, res: Response) => {
  const { user, sessionToken } = await loginUser({
    ...req.body,
    ipAddress: req.ip,
    userAgent: req.get("User-Agent") ?? null,
  });

  res.cookie("session", sessionToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: env.AUTH_SESSION_TTL_MS,
  });

  res.status(200).json({
    status: "success",
    data: user,
  });
};

export const logout = async (req: Request, res: Response) => {
  const sessionToken = req.cookies.session;
  await logoutUser(sessionToken);

  res.clearCookie("session", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
  });

  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
};

export const logoutAll = async (req: Request, res: Response) => {
  await logoutAllDevices(req.user.id);

  res.clearCookie("session", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
  });

  res.status(200).json({
    status: "success",
    message: "Logged out of all devices successfully.",
  });
};

export const completeInitialSetup = async (req: Request, res: Response) => {
  const user = await completeInitialSetupService({
    userId: req.user.id,
    name: req.body.name,
    password: req.body.password,
  });

  return res.status(200).json({
    status: "success",
    data: user,
  });
};

export const me = async (req: Request, res: Response) => {
  return res.status(200).json({ status: "success", data: req.user });
};
