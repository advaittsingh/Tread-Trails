import { config as dotenvConfig } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(configDir, "../..");
const monorepoRoot = path.join(backendRoot, "../..");

dotenvConfig({ path: path.join(backendRoot, ".env") });
dotenvConfig({ path: path.join(monorepoRoot, ".env.local") });
dotenvConfig({ path: path.join(monorepoRoot, ".env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16).optional(),
  CORS_ORIGINS: z.string().default("http://localhost:3000,http://localhost:5173"),
  SITE_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  CONTACT_TO_EMAIL: z.string().email().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment:", parsed.error.flatten().fieldErrors);
  throw new Error("Missing required environment variables (see apps/backend/.env.example)");
}

export const env = {
  ...parsed.data,
  jwtSecret:
    parsed.data.JWT_SECRET ??
    (parsed.data.NODE_ENV === "development"
      ? "dev-only-jwt-secret-min-32-chars!!"
      : undefined),
  corsOrigins: parsed.data.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean),
  siteUrl:
    parsed.data.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000",
  resendApiKey: parsed.data.RESEND_API_KEY ?? process.env.RESEND_API_KEY,
  resendFromEmail:
    parsed.data.RESEND_FROM_EMAIL ?? process.env.RESEND_FROM_EMAIL,
  contactToEmail:
    parsed.data.CONTACT_TO_EMAIL ?? process.env.CONTACT_TO_EMAIL,
};

if (!env.jwtSecret) {
  throw new Error("JWT_SECRET is required in production");
}
