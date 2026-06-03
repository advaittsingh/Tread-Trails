import { z } from "zod";

import { phoneSchema } from "@/lib/validations/phone";

export const accountProfileUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email address").max(254),
  /** Empty string clears stored phone */
  phone: z.union([z.literal(""), phoneSchema]),
  preferredVehicleSlug: z.union([z.null(), z.string().min(1).max(120)]),
});

export const accountChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "Use at least 8 characters").max(128),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "New passwords do not match",
        path: ["confirmPassword"],
      });
    }
    if (data.newPassword === data.currentPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Choose a password that differs from your current one",
        path: ["newPassword"],
      });
    }
  });
