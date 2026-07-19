import type { Request, Response } from "express";
import type { RegisterSchema } from "./auth-schema.js";
import { registerUser } from "./auth-service.js";

export const register = (req: Request, res: Response) => {
  const { email, name, password }: RegisterSchema = req.body;
  req.log.info("Registering user", { email, name, password });

  const user = registerUser({ email, name, password });

  return res.json({ message: "Ok" });
};
