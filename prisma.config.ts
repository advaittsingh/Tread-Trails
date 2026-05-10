import { config as dotenvConfig } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Ensure prisma CLI can resolve DATABASE_URL locally (Windows dev + Next uses .env.local).
dotenvConfig({ path: ".env.local" });
dotenvConfig();

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});

