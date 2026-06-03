import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordRequestSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(254),
});

export const resetPasswordSchema = z.object({
  token: z
    .string()
    .regex(/^[a-f0-9]{64}$/i, "Invalid or corrupted reset link"),
  password: z.string().min(8).max(128),
});
