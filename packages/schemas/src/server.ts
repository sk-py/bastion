import z from "zod";

const hostnameRegex =
  /^(?=.{1,253}$)(?!-)(?:[a-zA-Z0-9-]{1,63}\.)*[a-zA-Z0-9-]{1,63}$/;

const nameSchema = z
  .string()
  .trim()
  .min(2, "Server name must be at least 2 characters")
  .max(100, "Server name must be less than 100 characters");

const hostSchema = z
  .string()
  .trim()
  .min(1, "Host is required")
  .max(255, "Host is too long")
  .refine(
    (host) =>
      z.ipv4().safeParse(host).success ||
      z.ipv6().safeParse(host).success ||
      hostnameRegex.test(host),
    "Host must be a valid IPv4, IPv6, or hostname.",
  );

const portSchema = z
  .int()
  .min(1, "Port must be between 1 and 65535")
  .max(65535, "Port must be between 1 and 65535")
  .default(22);

const usernameSchema = z
  .string()
  .trim()
  .min(1, "Username is required")
  .max(32, "Username is too long")
  .regex(/^[a-zA-Z_][a-zA-Z0-9_-]*$/, "Invalid SSH username");

export const AUTH_METHODS = ["password", "private_key"] as const;

const authMethodSchema = z.enum(AUTH_METHODS);

const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .max(1024, "Password is too long")
  .optional();

const privateKeySchema = z
  .string()
  .trim()
  .max(50000, "Private key is too large")
  .refine(
    (key) =>
      key.startsWith("-----BEGIN OPENSSH PRIVATE KEY-----") ||
      key.startsWith("-----BEGIN RSA PRIVATE KEY-----") ||
      key.startsWith("-----BEGIN EC PRIVATE KEY-----") ||
      key.startsWith("-----BEGIN PRIVATE KEY-----"),
    "Unsupported private key format",
  )
  .optional();

const passPhraseSchema = z
  .string()
  .max(1024, "Passphrase is too long")
  .optional();

const serverInputSchema = z.object({
  name: nameSchema,
  host: hostSchema,
  port: portSchema,
  username: usernameSchema,
  authMethod: authMethodSchema,
  password: passwordSchema,
  privateKey: privateKeySchema,
  passphrase: passPhraseSchema,
});

export const serverSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),

  name: nameSchema,
  host: hostSchema,
  port: portSchema,
  username: usernameSchema,
  authMethod: authMethodSchema,

  hostname: z.string().nullable(),
  operatingSystem: z.string().nullable(),
  architecture: z.string().nullable(),
  kernelVersion: z.string().nullable(),
  sshVersion: z.string().nullable(),

  cpuCoreCount: z.number().int().nullable(),
  memoryTotalBytes: z.number().nullable(),
  diskTotalBytes: z.number().nullable(),

  hostFingerprint: z.string().nullable(),
  lastConnectedAt: z.iso.datetime().nullable(),
  discoveredAt: z.iso.datetime().nullable(),

  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const createServerSchema = serverInputSchema.superRefine((data, ctx) => {
  if (data.authMethod === "password") {
    if (!data.password) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "Password is required.",
      });
    }

    if (data.privateKey) {
      ctx.addIssue({
        code: "custom",
        path: ["privateKey"],
        message:
          "Private key must not be provided when using password authentication.",
      });
    }
  }

  if (data.authMethod === "private_key") {
    if (!data.privateKey) {
      ctx.addIssue({
        code: "custom",
        path: ["privateKey"],
        message: "Private key is required.",
      });
    }

    if (data.password) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message:
          "Password must not be provided when using private key authentication.",
      });
    }
  }
});

export const updateServerSchema = serverInputSchema
  .partial()
  .superRefine((data, ctx) => {
    if (data.authMethod === "password" && !data.password) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message:
          "Password is required when changing to password authentication.",
      });
    }

    if (data.authMethod === "private_key" && !data.privateKey) {
      ctx.addIssue({
        code: "custom",
        path: ["privateKey"],
        message:
          "Private key is required when changing to private key authentication.",
      });
    }

    if (data.authMethod === "password" && data.privateKey) {
      ctx.addIssue({
        code: "custom",
        path: ["privateKey"],
        message:
          "Private key must not be provided when using password authentication.",
      });
    }

    if (data.authMethod === "private_key" && data.password) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message:
          "Password must not be provided when using private key authentication.",
      });
    }
  });

export const serverIdSchema = z.object({
  id: z.uuid(),
});

export const deleteServerSchema = z.object({
  serverId: z.uuid(),
  workspaceId: z.uuid(),
});

export type CreateServerSchema = z.infer<typeof createServerSchema>;
export type UpdateServerSchema = z.infer<typeof updateServerSchema>;
export type DeleteServerSchema = z.infer<typeof deleteServerSchema>;
export type ServerIdSchema = z.infer<typeof serverIdSchema>;
