/** Map infra failures to safe responses — avoids masking DB/JWT issues as generic login failures */

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
          ? "Server missing DATABASE_URL — add your Neon Postgres connection string to .env.local and restart."
          : "Service unavailable.",
      },
    };
  }

  if (
    msg.includes("ECONNREFUSED") ||
    msg.includes("ENOTFOUND") ||
    msg.includes("SSL routines") ||
    msg.includes("IP whitelist")
  ) {
    return {
      status: 503,
      body: {
        error: dev
          ? "Cannot connect to Postgres — check DATABASE_URL (Neon), networking, and SSL settings."
          : "Service unavailable.",
      },
    };
  }

  console.error("[login]", error);
  return {
    status: 500,
    body: {
      error: dev
        ? "Unexpected login error — see server terminal logs."
        : "Login failed.",
    },
  };
}
