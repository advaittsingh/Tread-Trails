const API_BASE = String(import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

let csrfToken: string | null = null;

export async function ensureCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  const res = await fetch(resolveUrl("/api/auth/csrf"), { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load CSRF token");
  const data = (await res.json()) as { csrfToken?: string };
  if (!data.csrfToken) throw new Error("Invalid CSRF response");
  csrfToken = data.csrfToken;
  return csrfToken;
}

export function resetCsrfToken() {
  csrfToken = null;
}

function resolveUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!API_BASE) return p;
  return `${API_BASE}${p}`;
}

export function buildApiPath(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  const base = path.startsWith("/") ? path : `/${path}`;
  if (!params) return base;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    qs.set(key, String(value));
  }
  const q = qs.toString();
  return q ? `${base}?${q}` : base;
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers ?? {});
  const method = (init.method ?? "GET").toUpperCase();
  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;
  if (!isFormData && init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  if (isFormData && headers.has("content-type")) {
    headers.delete("content-type");
  }
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const skipCsrf =
      path.includes("/api/auth/login") ||
      path.includes("/api/auth/signup") ||
      path.includes("/api/auth/register") ||
      path.includes("/api/auth/forgot-password");
    if (!skipCsrf) {
      headers.set("x-csrf-token", await ensureCsrfToken());
    }
  }

  return fetch(resolveUrl(path), {
    ...init,
    credentials: "include",
    headers,
  });
}

export async function apiFetchJson<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await apiFetch(path, init);
  const text = await res.text();
  const json = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const msg =
      typeof json === "object" && json && "error" in json
        ? String((json as { error?: string }).error)
        : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return json as T;
}
