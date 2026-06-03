import { z } from "zod";

import { phoneSchema } from "@/lib/validations/phone";

export const corporateBusinessTypes = [
  "Fleet / multi-vehicle program",
  "Dealership or reseller partnership",
  "Corporate procurement",
  "Media or sponsorship",
  "Other",
] as const;

export type CorporateBusinessType = (typeof corporateBusinessTypes)[number];

export const corporateInquirySchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(200),
  contactPerson: z.string().trim().min(1, "Contact person is required").max(120),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .max(254),
  phone: phoneSchema,
  businessType: z.enum(corporateBusinessTypes),
  requirements: z
    .string()
    .trim()
    .min(30, "Please describe your requirements (at least 30 characters)")
    .max(8000),
});

export type CorporateInquiryValues = z.infer<typeof corporateInquirySchema>;
