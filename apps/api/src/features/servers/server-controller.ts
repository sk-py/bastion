import type { Request, Response } from "express";
import { addServer } from "./server-service.js";

export const addNewServer = async (req: Request, res: Response) => {
  const server = await addServer(req.body, req.user.id);
};
