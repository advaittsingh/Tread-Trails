import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const g = globalThis as typeof globalThis & { prisma?: PrismaClient };

function getPrismaClient(): PrismaClient {
  if (!g.prisma) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL is not set — Prisma cannot connect (check .env.local)."
      );
    }

    const adapter = new PrismaPg({ connectionString });

    g.prisma = new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === "development"
          ? ["error", "warn"]
          : ["error"],
    });
  }
  return g.prisma;
}

/**
 * Lazy Prisma client.
 *
 * Next.js can import route modules during build-time data collection; instantiating Prisma
 * at module load can break builds depending on the runtime shim. This proxy defers
 * constructing PrismaClient until the first actual usage.
 *
 * Prisma ORM 7+ requires a driver adapter for PostgreSQL (`@prisma/adapter-pg`).
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    return client[prop as keyof PrismaClient];
  },
});

if (process.env.NODE_ENV !== "production") g.prisma = getPrismaClient();
