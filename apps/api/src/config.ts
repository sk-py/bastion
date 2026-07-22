import dotenv from "dotenv";
import { z } from "zod";

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.url(),

  JWT_SECRET: z.string().min(1),

  LOG_DIR: z.string().default("logs"),
});

export const env = envSchema.parse(process.env);