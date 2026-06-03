import { z } from "zod";

import { phoneSchema } from "./phone.js";

export const contactFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email address").max(254),
  phone: phoneSchema,
  subject: z.string().trim().min(1, "Subject is required").max(200),
  message: z
    .string()
    .trim()
    .min(10, "Please enter at least 10 characters")
    .max(5000),
});

export const corporateBusinessTypes = [
  "Fleet / multi-vehicle program",
  "Dealership or reseller partnership",
  "Corporate procurement",
  "Media or sponsorship",
  "Other",
] as const;

export const corporateInquirySchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(200),
  contactPerson: z.string().trim().min(1, "Contact person is required").max(120),
  email: z.string().trim().email("Enter a valid email address").max(254),
  phone: phoneSchema,
  businessType: z.enum(corporateBusinessTypes),
  requirements: z
    .string()
    .trim()
    .min(30, "Please describe your requirements (at least 30 characters)")
    .max(8000),
});
