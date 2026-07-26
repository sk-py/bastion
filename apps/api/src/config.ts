import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const encryptionKeySchema = z
  .string()
  .trim()
  .regex(
    /^[a-fA-F0-9]{64}$/,
    "ENCRYPTION_KEY must be a 64-character hexadecimal string (32 bytes).",
);
  
const parseTrustProxy = (value: string | undefined): boolean | number | string => {
  if (!value || value === "false") return false;
  if (value === "true") return true;
  const asNumber = Number(value);
  return Number.isNaN(asNumber) ? value : asNumber; // "1" -> 1 hop, "loopback" / CIDR list passed through as-is
};

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(1),
  LOG_DIR: z.string().default("logs"),
  AUTH_SESSION_TTL_MS: z.coerce.number().default(1000 * 60 * 60 * 6),
  ENCRYPTION_KEY: encryptionKeySchema,
  TRUST_PROXY: z.string().optional().transform(parseTrustProxy),
});

export const env = envSchema.parse(process.env);
