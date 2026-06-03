type FetchJsonOptions = {
  revalidate?: number;
  tags?: string[];
};

function getApiBase(): string | null {
  const base =
    process.env.BACKEND_API_URL ??
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL;
  if (!base?.trim()) return null;
  return base.replace(/\/$/, "");
}

export async function apiFetchJson<T>(
  path: string,
  options: FetchJsonOptions = {}
): Promise<T> {
  const base = getApiBase();
  if (!base) throw new Error("API base URL is not configured");

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}${normalizedPath}`;

  const res = await fetch(url, {
    cache: "force-cache",
    next:
      options.revalidate || options.tags
        ? { revalidate: options.revalidate, tags: options.tags }
        : undefined,
  });

  const text = await res.text();
  const json = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const msg =
      typeof json === "object" && json && "error" in json
        ? String((json as any).error)
        : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return json as T;
}

