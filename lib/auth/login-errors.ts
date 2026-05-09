/** Map infra failures to safe responses — avoids masking DB/JWT issues as generic login failures */

export function loginFailureResponse(error: unknown): {
  status: number;
  body: { error: string };
} {
  const dev = process.env.NODE_ENV === "development";
  const msg =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";

  if (msg.includes("MONGODB_URI is not set")) {
    return {
      status: 503,
      body: {
        error: dev
          ? "Server missing MONGODB_URI — add it to .env.local and restart."
          : "Service unavailable.",
      },
    };
  }

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

  if (
    msg.includes("ECONNREFUSED") ||
    msg.includes("ENOTFOUND") ||
    msg.includes("MongoNetwork") ||
    msg.includes("MongoServerSelection") ||
    msg.includes("querySrv") ||
    msg.includes("SSL routines") ||
    msg.includes("IP whitelist")
  ) {
    return {
      status: 503,
      body: {
        error: dev
          ? "Cannot connect to MongoDB — start MongoDB locally or fix MONGODB_URI (Atlas IP access / VPN)."
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
