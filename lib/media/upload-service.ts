import { prisma } from "@/lib/prisma";
import {
  isMediaStorageConfigured,
  storeMediaFile,
  type MediaProvider,
} from "@/lib/media/storage";
import {
  parseTagsInput,
  validateUploadFile,
} from "@/lib/media/validate-upload";

import type { MediaAssetDTO } from "@/lib/media/types";

export type { MediaAssetDTO };

export function toMediaAssetDTO(row: {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  folder: string;
  tags: string[];
  altText: string | null;
  provider: string;
  createdAt: Date;
}): MediaAssetDTO {
  return {
    id: row.id,
    url: row.url,
    filename: row.filename,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    width: row.width,
    height: row.height,
    folder: row.folder,
    tags: row.tags,
    altText: row.altText,
    provider: row.provider,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function uploadAndRegisterMedia(opts: {
  file: File;
  folderRaw: unknown;
  tagsRaw?: unknown;
  altText?: string | null;
  adminId: string;
  provider?: MediaProvider;
}): Promise<MediaAssetDTO> {
  if (!isMediaStorageConfigured()) {
    throw new Error(
      "Media storage is not configured. Set BLOB_READ_WRITE_TOKEN or Cloudinary credentials."
    );
  }

  const arrayBuffer = await opts.file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const bytes = new Uint8Array(arrayBuffer);

  const validation = validateUploadFile(opts.file, bytes, opts.folderRaw);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const stored = await storeMediaFile({
    buffer,
    folder: validation.folder,
    filename: opts.file.name,
    mimeType: opts.file.type,
    provider: opts.provider,
  });

  const tags = parseTagsInput(opts.tagsRaw);
  const asset = await prisma.mediaAsset.create({
    data: {
      url: stored.url,
      storageKey: stored.storageKey,
      provider: stored.provider,
      filename: opts.file.name,
      mimeType: opts.file.type,
      sizeBytes: opts.file.size,
      width: stored.width ?? null,
      height: stored.height ?? null,
      folder: validation.folder,
      tags,
      altText: opts.altText?.trim() || null,
      uploadedById: opts.adminId,
    },
  });

  return toMediaAssetDTO(asset);
}
