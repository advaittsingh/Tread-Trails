"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Check, ImagePlus, Loader2, Search } from "lucide-react";

import type { MediaAssetDTO } from "@/lib/media/types";
import { MEDIA_FOLDERS, MEDIA_FOLDER_LABELS } from "@/lib/media/constants";
import { uploadMediaFile } from "@/lib/media/client-upload";
import { mediaThumbnailUrl } from "@/lib/media/optimize-url";
import { toastError, toastSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

import { adminInputClass, adminSelectClass } from "@/components/admin/admin-form-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string, asset?: MediaAssetDTO) => void;
  folder?: string;
  title?: string;
};

export function AdminMediaPicker({
  open,
  onOpenChange,
  onSelect,
  folder: defaultFolder = "uploads",
  title = "Media library",
}: Props) {
  const [assets, setAssets] = useState<MediaAssetDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [folder, setFolder] = useState(defaultFolder);
  const [tag, setTag] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ limit: "48" });
      if (search.trim()) qs.set("search", search.trim());
      if (folder) qs.set("folder", folder);
      if (tag) qs.set("tag", tag);
      const res = await fetch(`/api/admin/media?${qs}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setAssets(data.assets as MediaAssetDTO[]);
      setTags((data.tags as string[]) ?? []);
    } catch (e) {
      toastError("Could not load media", e instanceof Error ? e.message : "Error");
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [search, folder, tag]);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchDraft), 350);
    return () => window.clearTimeout(t);
  }, [searchDraft]);

  useEffect(() => {
    if (open) setFolder(defaultFolder);
  }, [open, defaultFolder]);

  async function onUpload(file: File) {
    setUploading(true);
    try {
      const asset = await uploadMediaFile(file, { folder });
      toastSuccess("Uploaded", asset.filename);
      await load();
    } catch (e) {
      toastError("Upload failed", e instanceof Error ? e.message : "Error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col border-zinc-800 bg-zinc-950 sm:max-w-xl"
      >
        <SheetHeader>
          <SheetTitle className="text-zinc-100">{title}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-hidden pt-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              className="border-zinc-600 text-zinc-200"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/jpeg,image/png,image/webp,image/gif,image/avif";
                input.onchange = () => {
                  const f = input.files?.[0];
                  if (f) void onUpload(f);
                };
                input.click();
              }}
            >
              {uploading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <ImagePlus className="mr-2 size-4" />
              )}
              Upload
            </Button>
            <div className="relative min-w-[140px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <Input
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                placeholder="Search…"
                className={cn(adminInputClass, "pl-9")}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className={cn(adminSelectClass, "h-9 text-xs")}
            >
              <option value="">All folders</option>
              {MEDIA_FOLDERS.map((f) => (
                <option key={f} value={f}>
                  {MEDIA_FOLDER_LABELS[f]}
                </option>
              ))}
            </select>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className={cn(adminSelectClass, "h-9 text-xs")}
            >
              <option value="">All tags</option>
              {tags.map((t) => (
                <option key={t} value={t}>
                  #{t}
                </option>
              ))}
            </select>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg bg-zinc-800" />
                ))}
              </div>
            ) : assets.length === 0 ? (
              <p className="py-12 text-center text-sm text-zinc-500">No assets found.</p>
            ) : (
              <ul className="grid grid-cols-3 gap-2">
                {assets.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      className="group relative aspect-square w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 ring-emerald-500/40 transition hover:ring-2"
                      onClick={() => {
                        onSelect(a.url, a);
                        onOpenChange(false);
                      }}
                    >
                      <Image
                        src={mediaThumbnailUrl(a.url, 240)}
                        alt={a.altText ?? a.filename}
                        fill
                        className="object-cover"
                        sizes="120px"
                        unoptimized={!a.url.includes("res.cloudinary.com")}
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950/90 to-transparent px-1.5 py-1 text-left text-[9px] text-zinc-300 opacity-0 transition group-hover:opacity-100">
                        {a.filename}
                      </span>
                      <span className="absolute right-1 top-1 rounded bg-zinc-950/80 p-0.5 opacity-0 transition group-hover:opacity-100">
                        <Check className="size-3 text-emerald-400" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
