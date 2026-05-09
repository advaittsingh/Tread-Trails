import { PrismaClient } from "@prisma/client";

const g = globalThis as typeof globalThis & { prisma?: PrismaClient };

export const prisma =
  g.prisma ??
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") g.prisma = prisma;

