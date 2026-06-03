const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

function resolveUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${p}` : p;
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  return fetch(resolveUrl(path), {
    ...init,
    credentials: "include",
  });
}

