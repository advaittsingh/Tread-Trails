/**
 * Create or reset admin login — reads `.env.local` then `.env` via dotenv.
 *
 * Required in env:
 *   MONGODB_URI
 *   SEED_ADMIN_PASSWORD (min 8 chars)
 *
 * Optional:
 *   SEED_ADMIN_EMAIL (default: admin@treadtrails.com)
 *   SEED_ADMIN_NAME
 *
 * Run: npm run seed:admin
 */

import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

import { hashPassword } from "../lib/auth/password";
import { connectDB } from "../lib/db";
import { User } from "../lib/models/User";

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is required (.env.local or environment)");
    process.exit(1);
  }

  const email =
    (process.env.SEED_ADMIN_EMAIL ?? "admin@treadtrails.com")
      .toLowerCase()
      .trim();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "";
  if (password.length < 8) {
    console.error(
      "Set SEED_ADMIN_PASSWORD (≥ 8 chars) in .env.local — example:\n" +
        "  SEED_ADMIN_EMAIL=admin@treadtrails.com\n" +
        "  SEED_ADMIN_PASSWORD=YourStrongPassHere\n"
    );
    process.exit(1);
  }

  const name = process.env.SEED_ADMIN_NAME?.trim() || "Studio Admin";

  await connectDB();
  const passwordHash = await hashPassword(password);

  await User.findOneAndUpdate(
    { email },
    {
      email,
      passwordHash,
      name,
      role: "admin",
    },
    { upsert: true, new: true }
  );

  console.info(`Admin ready → ${email} (${name})`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
