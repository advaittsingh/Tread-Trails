import { config as dotenvConfig } from "dotenv";
import { defineConfig, env } from "prisma/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(backendRoot, "../..");

dotenvConfig({ path: path.join(backendRoot, ".env") });
dotenvConfig({ path: path.join(monorepoRoot, ".env.local") });
dotenvConfig({ path: path.join(monorepoRoot, ".env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
