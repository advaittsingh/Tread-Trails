import { z } from "zod";

import { phoneSchema } from "@/lib/validations/phone";

export const contactFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .max(254),
  phone: phoneSchema,
  subject: z.string().trim().min(1, "Subject is required").max(200),
  message: z
    .string()
    .trim()
    .min(10, "Please enter at least 10 characters")
    .max(5000),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
