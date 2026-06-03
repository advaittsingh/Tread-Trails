export type ParsedDevice = {
  deviceType: "mobile" | "tablet" | "desktop" | "bot" | "unknown";
  deviceLabel: string;
};

export function parseUserAgent(ua: string): ParsedDevice {
  const raw = ua.trim();
  if (!raw) {
    return { deviceType: "unknown", deviceLabel: "Unknown device" };
  }

  const lower = raw.toLowerCase();
  if (
    /bot|crawl|spider|slurp|facebookexternalhit|preview/i.test(raw)
  ) {
    return { deviceType: "bot", deviceLabel: "Bot / crawler" };
  }

  let deviceType: ParsedDevice["deviceType"] = "desktop";
  if (/ipad|tablet|kindle|playbook/i.test(lower)) {
    deviceType = "tablet";
  } else if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(lower)) {
    deviceType = "mobile";
  } else if (/android/i.test(lower)) {
    deviceType = "tablet";
  }

  let browser = "Browser";
  if (/edg\//i.test(raw)) browser = "Edge";
  else if (/chrome\//i.test(raw) && !/chromium/i.test(raw)) browser = "Chrome";
  else if (/firefox\//i.test(raw)) browser = "Firefox";
  else if (/safari\//i.test(raw) && !/chrome/i.test(raw)) browser = "Safari";
  else if (/opr\//i.test(raw) || /opera/i.test(raw)) browser = "Opera";

  let os = "";
  if (/windows nt/i.test(raw)) os = "Windows";
  else if (/mac os x/i.test(raw) && !/iphone|ipad/i.test(raw)) os = "macOS";
  else if (/iphone|ipad|ipod/i.test(raw)) os = "iOS";
  else if (/android/i.test(raw)) os = "Android";
  else if (/linux/i.test(raw)) os = "Linux";

  const deviceLabel = os ? `${browser} · ${os}` : browser;
  return { deviceType, deviceLabel };
}
