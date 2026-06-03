import type { MediaAssetDTO } from "@/lib/media/types";

export async function uploadMediaFile(
  file: File,
  opts: { folder?: string; tags?: string; altText?: string } = {}
): Promise<MediaAssetDTO> {
  const fd = new FormData();
  fd.append("file", file);
  if (opts.folder) fd.append("folder", opts.folder);
  if (opts.tags) fd.append("tags", opts.tags);
  if (opts.altText) fd.append("altText", opts.altText);

  const res = await fetch("/api/admin/media", {
    method: "POST",
    body: fd,
    credentials: "include",
  });
  const data = (await res.json().catch(() => ({}))) as {
    asset?: MediaAssetDTO;
    error?: string;
  };
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  if (!data.asset) throw new Error("No asset returned");
  return data.asset;
}
