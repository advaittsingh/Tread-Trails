import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { env } from "../config/env.js";

const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
    globalForPrisma.prisma = new PrismaClient({
      adapter,
      log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }
  return globalForPrisma.prisma;
}

export const prisma = getPrisma();
