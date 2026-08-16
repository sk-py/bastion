import type { Request, Response } from "express";
import { getWorkspaceServers, getWorkspaceUsers } from "./workspace-service.js";

export const listUsers = async (
  req: Request,
  res: Response,
) => {
  const users = await getWorkspaceUsers(
    req.user.workspaceId,
  );

  return res.status(200).json({
    status: "success",
    data: users,
  });
};

export const listServers = async (
  req: Request,
  res: Response,
) => {
  const servers = await getWorkspaceServers(
    req.user.workspaceId,
  );

  return res.status(200).json({
    status: "success",
    data: servers,
  });
};