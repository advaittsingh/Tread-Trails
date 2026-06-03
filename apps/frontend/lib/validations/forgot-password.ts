import { z } from "zod";

export const forgotPasswordRequestSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(254),
});

export type ForgotPasswordRequestValues = z.infer<
  typeof forgotPasswordRequestSchema
>;

export const resetPasswordSchema = z.object({
  token: z
    .string()
    .regex(/^[a-f0-9]{64}$/i, "Invalid or corrupted reset link"),
  password: z.string().min(8).max(128),
});

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
