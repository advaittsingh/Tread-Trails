export type MediaAssetDTO = {
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
  createdAt: string;
};
