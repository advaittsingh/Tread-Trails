export function loginFailureResponse(error: unknown): {
  status: number;
  body: { error: string };
} {
  const dev = process.env.NODE_ENV === "development";
  const msg =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";

  if (msg.includes("JWT_SECRET")) {
    return {
      status: 503,
      body: {
        error: dev
          ? "Server missing JWT_SECRET — use at least 16 characters in .env.local."
          : "Service unavailable.",
      },
    };
  }

  if (msg.includes("DATABASE_URL")) {
    return {
      status: 503,
      body: {
        error: dev
          ? "Server missing DATABASE_URL — add your Postgres connection string and restart."
          : "Service unavailable.",
      },
    };
  }

  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: string }).code)
      : "";

  if (
    code === "ECONNREFUSED" ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("ENOTFOUND") ||
    msg.includes("Can't reach database server") ||
    code === "P1001"
  ) {
    return {
      status: 503,
      body: {
        error: dev
          ? "Database is offline — start PostgreSQL or Prisma Dev, then restart the API."
          : "Service unavailable.",
      },
    };
  }

  console.error("[auth/login]", error);
  return {
    status: 500,
    body: {
      error: dev
        ? "Unexpected login error — see server terminal logs."
        : "Login failed.",
    },
  };
}
