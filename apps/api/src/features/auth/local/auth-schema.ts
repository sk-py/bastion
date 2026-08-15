import * as z from "zod";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email());

const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters long")
  .max(100, "Password must be less than 100 characters")
  .regex(
    /^(?=.*[A-Za-z])(?=.*\d).{6,}$/,
    "Password must contain at least one letter and one number",
  );

const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name is too long");


export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resendVerificationSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  token: z.string(),
});

export const verifyEmailSchema = z.object({
  token: z.string(),
});

export const initialSetupSchema = z.object({
  name: nameSchema,
  password: passwordSchema,
});

export type InitialSetupSchema = z.infer<typeof initialSetupSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type ResendVerificationSchema = z.infer<typeof resendVerificationSchema>;
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailSchema = z.infer<typeof verifyEmailSchema>;
