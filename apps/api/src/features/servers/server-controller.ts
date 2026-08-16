import type { Request, Response } from "express";
import {
  addServer,
  deleteServerById,
  getAllServers as getAllServerService,
  updateServerService,
  testServerConnection as testServerConnectionService,
} from "./server-service.js";
import type { ServerIdSchema } from "@bastion/schemas";
import type { User } from "../auth/local/auth-types.js";

export const addNewServer = async (req: Request, res: Response) => {
  const createdServer = await addServer(
    req.body,
    req.user.id,
    req.user.workspaceId,
  );

  res.status(201).json({
    status: "success",
    data: createdServer,
  });
};

export const getAllServers = async (req: Request, res: Response) => {
  const { id, workspaceId, role } = req.user as User;
  const servers = await getAllServerService(id, workspaceId, role);

  res.status(200).json({
    status: "success",
    data: servers,
  });
};

export const updateServer = async (req: Request, res: Response) => {
  const { id: userId, workspaceId, role } = req.user as User;
  const { id } = req.params as ServerIdSchema;

  const server = await updateServerService(
    req.body,
    id,
    userId,
    workspaceId,
    role,
  );

  return res.status(200).json({
    status: "success",
    data: server,
  });
};

export const removeServerById = async (req: Request, res: Response) => {
  const { id } = req.params as ServerIdSchema;
  const workspaceId = req.user.workspaceId;

  await deleteServerById({ serverId: id, workspaceId  });

  res.status(200).json({
    status: "success",
    message: "Server deleted successfully",
  });
};

export const testServerConnection = async (req: Request, res: Response) => {
  const { id: userId, workspaceId, role } = req.user as User;
  const { id } = req.params as ServerIdSchema;

  await testServerConnectionService(id, userId, workspaceId, role);

  res.status(200).json({
    status: "success",
    message: "Connection is valid!",
  });
};
