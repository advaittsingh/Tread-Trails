import { createHash } from "node:crypto";

import { del, put } from "@vercel/blob";

import { safeFilename } from "@/lib/media/validate-upload";

export type MediaProvider = "blob" | "cloudinary";

export type StoredMedia = {
  url: string;
  storageKey: string;
  provider: MediaProvider;
  width?: number;
  height?: number;
};

export function resolveMediaProvider(): MediaProvider {
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    return "cloudinary";
  }
  return "blob";
}

export function isBlobStorageConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function isCloudinaryConfigured(): boolean {
  return resolveMediaProvider() === "cloudinary";
}

export function isMediaStorageConfigured(): boolean {
  return isBlobStorageConfigured() || isCloudinaryConfigured();
}

async function uploadToBlob(
  buffer: Buffer,
  folder: string,
  filename: string,
  mimeType: string
): Promise<StoredMedia> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN is not configured");

  const key = `admin/${folder}/${Date.now()}-${safeFilename(filename)}`;
  const blob = await put(key, buffer, {
    access: "public",
    token,
    contentType: mimeType,
  });

  return {
    url: blob.url,
    storageKey: key,
    provider: "blob",
  };
}

async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  filename: string
): Promise<StoredMedia> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;

  const timestamp = Math.round(Date.now() / 1000);
  const folderPath = `tread-trails/${folder}`;
  const paramsToSign = `folder=${folderPath}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash("sha1").update(paramsToSign).digest("hex");

  const body = new FormData();
  body.append(
    "file",
    new Blob([buffer], { type: "application/octet-stream" }),
    safeFilename(filename)
  );
  body.append("api_key", apiKey);
  body.append("timestamp", String(timestamp));
  body.append("folder", folderPath);
  body.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body }
  );
  const data = (await res.json()) as {
    secure_url?: string;
    public_id?: string;
    width?: number;
    height?: number;
    error?: { message?: string };
  };

  if (!res.ok || !data.secure_url) {
    throw new Error(data.error?.message ?? "Cloudinary upload failed");
  }

  return {
    url: data.secure_url,
    storageKey: data.public_id ?? "",
    provider: "cloudinary",
    width: data.width,
    height: data.height,
  };
}

export async function storeMediaFile(opts: {
  buffer: Buffer;
  folder: string;
  filename: string;
  mimeType: string;
  provider?: MediaProvider;
}): Promise<StoredMedia> {
  const provider = opts.provider ?? resolveMediaProvider();
  if (provider === "cloudinary") {
    return uploadToCloudinary(opts.buffer, opts.folder, opts.filename);
  }
  return uploadToBlob(opts.buffer, opts.folder, opts.filename, opts.mimeType);
}

export async function deleteStoredMedia(asset: {
  provider: string;
  storageKey: string | null;
  url: string;
}): Promise<void> {
  if (asset.provider === "cloudinary" && asset.storageKey) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) return;

    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = `public_id=${asset.storageKey}&timestamp=${timestamp}${apiSecret}`;
    const signature = createHash("sha1").update(paramsToSign).digest("hex");
    const qs = new URLSearchParams({
      public_id: asset.storageKey,
      api_key: apiKey,
      timestamp: String(timestamp),
      signature,
    });
    await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy?${qs}`,
      { method: "POST" }
    ).catch(() => undefined);
    return;
  }

  if (asset.provider === "blob" && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await del(asset.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    } catch {
      /* blob may already be gone */
    }
  }
}
