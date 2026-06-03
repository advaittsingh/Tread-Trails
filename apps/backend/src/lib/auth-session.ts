import type { Role } from "@tread-trails/shared-constants";

import { prisma } from "./prisma.js";

export type ResolvedAuthUser = {
  id: string;
  role: Role;
  status: "active" | "suspended";
};

export class AuthSessionError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "AuthSessionError";
  }
}

export async function resolveAuthUser(
  userId: string,
  tokenIssuedAtSec?: number
): Promise<ResolvedAuthUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      status: true,
      sessionInvalidatedAt: true,
    },
  });

  if (!user) {
    throw new AuthSessionError(401, "Unauthorized");
  }

  if (user.status === "suspended") {
    throw new AuthSessionError(403, "Account suspended");
  }

  if (
    user.sessionInvalidatedAt &&
    tokenIssuedAtSec != null &&
    tokenIssuedAtSec * 1000 < user.sessionInvalidatedAt.getTime()
  ) {
    throw new AuthSessionError(401, "Session expired");
  }

  return {
    id: user.id,
    role: user.role as Role,
    status: user.status,
  };
}

export async function invalidateUserSessions(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { sessionInvalidatedAt: new Date() },
  });
}
