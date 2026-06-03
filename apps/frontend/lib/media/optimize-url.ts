type OptimizeOpts = {
  width?: number;
  height?: number;
  quality?: number;
  format?: "auto" | "webp" | "avif";
};

/**
 * Delivery URL with transforms when stored on Cloudinary.
 * Vercel Blob URLs are passed through — use `next/image` for optimization.
 */
export function optimizedMediaUrl(url: string, opts: OptimizeOpts = {}): string {
  if (!url.includes("res.cloudinary.com")) return url;

  const uploadIdx = url.indexOf("/upload/");
  if (uploadIdx === -1) return url;

  const parts: string[] = [];
  if (opts.width) parts.push(`w_${Math.min(opts.width, 2400)}`);
  if (opts.height) parts.push(`h_${Math.min(opts.height, 2400)}`);
  parts.push("c_limit");
  if (opts.quality) parts.push(`q_${Math.min(100, Math.max(1, opts.quality))}`);
  if (opts.format === "webp") parts.push("f_webp");
  else if (opts.format === "avif") parts.push("f_avif");
  else parts.push("f_auto");

  const transform = parts.join(",");
  const prefix = url.slice(0, uploadIdx + "/upload/".length);
  const suffix = url.slice(uploadIdx + "/upload/".length);
  if (suffix.startsWith("v")) return `${prefix}${transform}/${suffix}`;
  return `${prefix}${transform}/${suffix}`;
}

export function mediaThumbnailUrl(url: string, size = 320): string {
  return optimizedMediaUrl(url, { width: size, quality: 80, format: "auto" });
}
