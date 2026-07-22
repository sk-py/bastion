import type { Request, Response } from "express";
import type { RegisterSchema } from "./auth-schema.js";
import { registerUser } from "./auth-service.js";

export const register = async (req: Request, res: Response) => {
  const { name, email, password }: RegisterSchema = req.body;
  req.log.info("Registering user", { name, email });
  const user = await registerUser({ email, name, password });
  return res.status(201).json({ status: "success", data: user });
};
