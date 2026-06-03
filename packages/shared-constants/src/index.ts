/** Session cookie name — keep in sync across frontend, admin, backend. */
export const AUTH_COOKIE = "tt_session";

/** Default API path prefix on the backend. */
export const API_PREFIX = "/api";

export const ROLES = {
  USER: "user",
  ADMIN: "admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
