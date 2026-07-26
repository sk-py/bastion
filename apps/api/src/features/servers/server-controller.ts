import type { Request, Response } from "express";
import {
  addServer,
  deleteServerById,
  getAllServers as getAllServerService,
  updateServerService,
} from "./server-service.js";
import type { ServerIdSchema } from "./server-schema.js";

export const addNewServer = async (req: Request, res: Response) => {
  const createdServer = await addServer(req.body, req.user.id);

  res.status(201).json({
    status: "success",
    data: createdServer,
  });
};

export const getAllServers = async (req: Request, res: Response) => {
  const id = req.user.id;
  const servers = await getAllServerService(id);

  res.status(200).json({
    status: "success",
    data: servers,
  });
};

export const updateServer = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { id } = req.params as ServerIdSchema;

  const server = await updateServerService(req.body, id, userId);

  return res.status(200).json({
    status: "success",
    data: server,
  });
};

export const removeServerById = async (req: Request, res: Response) => {
  const { id } = req.params as ServerIdSchema;
  const userId = req.user.id;

  await deleteServerById({ serverId: id, userId });

  res.status(200).json({
    status: "success",
    message: "Server deleted successfully",
  });
};
