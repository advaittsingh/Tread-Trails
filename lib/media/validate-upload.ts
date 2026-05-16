import {
  MEDIA_ALLOWED_MIME,
  MEDIA_MAX_BYTES,
  MEDIA_FOLDERS,
  type MediaFolder,
} from "@/lib/media/constants";

export type UploadValidationResult =
  | { ok: true; folder: MediaFolder }
  | { ok: false; error: string };

/** Magic-byte sniff for common raster formats (defense in depth beyond MIME). */
export function sniffImageMime(buffer: Uint8Array): string | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return "image/gif";
  }
  const riff =
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46;
  const webp =
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50;
  if (riff && webp) return "image/webp";
  if (
    buffer[0] === 0x00 &&
    buffer[1] === 0x00 &&
    buffer[2] === 0x00 &&
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    return "image/avif";
  }
  return null;
}

export function safeFilename(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120);
  return base || "file";
}

export function parseMediaFolder(raw: unknown): MediaFolder {
  if (typeof raw === "string" && (MEDIA_FOLDERS as readonly string[]).includes(raw)) {
    return raw as MediaFolder;
  }
  return "uploads";
}

export function validateUploadFile(
  file: File,
  buffer: Uint8Array,
  folderRaw: unknown
): UploadValidationResult {
  if (!MEDIA_ALLOWED_MIME.has(file.type)) {
    return {
      ok: false,
      error: "Only JPEG, PNG, WebP, GIF, and AVIF images are allowed.",
    };
  }

  if (file.size > MEDIA_MAX_BYTES) {
    return { ok: false, error: "Image must be 8 MB or smaller." };
  }

  if (file.size === 0) {
    return { ok: false, error: "File is empty." };
  }

  const sniffed = sniffImageMime(buffer);
  if (!sniffed || !MEDIA_ALLOWED_MIME.has(sniffed)) {
    return {
      ok: false,
      error: "File content does not match a supported image format.",
    };
  }

  if (sniffed !== file.type && file.type !== "image/jpeg" && sniffed !== "image/jpeg") {
    return {
      ok: false,
      error: "Declared MIME type does not match file contents.",
    };
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  const allowedExt = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);
  if (ext && !allowedExt.has(ext)) {
    return { ok: false, error: "Unsupported file extension." };
  }

  return { ok: true, folder: parseMediaFolder(folderRaw) };
}

export function parseTagsInput(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => /^[a-z0-9-]{1,40}$/.test(t))
      .slice(0, 20);
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => /^[a-z0-9-]{1,40}$/.test(t))
      .slice(0, 20);
  }
  return [];
}
