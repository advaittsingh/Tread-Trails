/**
 * Create or reset admin login (reads monorepo .env.local).
 * Run: pnpm --filter @tread-trails/backend seed:admin
 */

import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const monorepoRoot = path.join(backendRoot, "../..");

config({ path: path.join(monorepoRoot, ".env.local") });
config({ path: path.join(monorepoRoot, ".env") });

import { hashPassword } from "../src/lib/password.js";
import { prisma } from "../src/lib/prisma.js";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required (.env.local or environment)");
    process.exit(1);
  }

  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@treadtrails.com")
    .toLowerCase()
    .trim();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "";
  if (password.length < 8) {
    console.error(
      "Set SEED_ADMIN_PASSWORD (≥ 8 chars) in .env.local at monorepo root"
    );
    process.exit(1);
  }

  const name = process.env.SEED_ADMIN_NAME?.trim() || "Studio Admin";
  const passwordHash = await hashPassword(password);

  await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash, name, role: "admin" },
    update: { passwordHash, name, role: "admin" },
  });

  console.info(`Admin ready → ${email} (${name})`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
