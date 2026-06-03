export type GeoResult = {
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
};

export async function lookupGeo(ip: string): Promise<GeoResult> {
  const clean = ip.replace(/^::ffff:/, "").trim();
  if (
    !clean ||
    clean === "127.0.0.1" ||
    clean.startsWith("192.168.") ||
    clean.startsWith("10.")
  ) {
    return {};
  }

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 900);
  try {
    const res = await fetch(`https://ipapi.co/${clean}/json/`, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return {};
    const data = (await res.json()) as {
      city?: string;
      country_name?: string;
      latitude?: number;
      longitude?: number;
      error?: boolean;
    };
    if (data.error) return {};
    return {
      city: data.city,
      country: data.country_name,
      lat: data.latitude,
      lng: data.longitude,
    };
  } catch {
    return {};
  } finally {
    clearTimeout(t);
  }
}
