"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Copy,
  ImageIcon,
  Loader2,
  Search,
  Trash2,
  Upload,
} from "lucide-react";

import type { MediaAssetDTO } from "@/lib/media/types";
import {
  MEDIA_FOLDERS,
  MEDIA_FOLDER_LABELS,
  type MediaFolder,
} from "@/lib/media/constants";
import { uploadMediaFile } from "@/lib/media/client-upload";
import { mediaThumbnailUrl } from "@/lib/media/optimize-url";
import { useConfirmation } from "@/contexts/confirmation-context";
import { toastError, toastSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

import { ADMIN_CONFIRM_DIALOG_CLASS } from "@/components/admin/admin-confirm-styles";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminPageHeader } from "@/components/admin/admin-form-ui";
import { AdminPaginationBar } from "@/components/admin/admin-pagination-bar";
import { adminInputClass, adminSelectClass } from "@/components/admin/admin-form-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdminMediaLibrary() {
  const { confirmDelete } = useConfirmation();
  const fileRef = useRef<HTMLInputElement>(null);

  const [assets, setAssets] = useState<MediaAssetDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(24);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [folder, setFolder] = useState<MediaFolder | "">("");
  const [tag, setTag] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [folderCounts, setFolderCounts] = useState<Record<string, number>>({});
  const [uploadFolder, setUploadFolder] = useState<MediaFolder>("uploads");
  const [uploadTags, setUploadTags] = useState("");
  const [selected, setSelected] = useState<MediaAssetDTO | null>(null);
  const [editTags, setEditTags] = useState("");
  const [editAlt, setEditAlt] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search.trim()) qs.set("search", search.trim());
      if (folder) qs.set("folder", folder);
      if (tag) qs.set("tag", tag);

      const res = await fetch(`/api/admin/media?${qs}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setAssets(data.assets as MediaAssetDTO[]);
      setTotal(data.total as number);
      setTotalPages(data.totalPages as number);
      setTags((data.tags as string[]) ?? []);
      setFolderCounts((data.folderCounts as Record<string, number>) ?? {});
    } catch (e) {
      toastError("Could not load media", e instanceof Error ? e.message : "Error");
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, folder, tag]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(searchDraft);
      setPage(1);
    }, 400);
    return () => window.clearTimeout(t);
  }, [searchDraft]);

  useEffect(() => {
    if (selected) {
      setEditTags(selected.tags.join(", "));
      setEditAlt(selected.altText ?? "");
    }
  }, [selected]);

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadMediaFile(file, {
          folder: uploadFolder,
          tags: uploadTags,
        });
      }
      toastSuccess("Upload complete", `${files.length} file(s) added`);
      await load();
    } catch (e) {
      toastError("Upload failed", e instanceof Error ? e.message : "Error");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function saveMeta() {
    if (!selected) return;
    setSavingMeta(true);
    try {
      const res = await fetch(`/api/admin/media/${selected.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tags: editTags
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean),
          altText: editAlt.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSelected(data.asset as MediaAssetDTO);
      toastSuccess("Asset updated");
      await load();
    } catch (e) {
      toastError("Save failed", e instanceof Error ? e.message : "Error");
    } finally {
      setSavingMeta(false);
    }
  }

  async function deleteAsset(asset: MediaAssetDTO) {
    const ok = await confirmDelete({
      title: "Delete this asset?",
      description: "Removes the file from storage and the media library. URLs in published content may break.",
      contentClassName: ADMIN_CONFIRM_DIALOG_CLASS,
    });
    if (!ok) return;

    setDeletingId(asset.id);
    try {
      const res = await fetch(`/api/admin/media/${asset.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      if (selected?.id === asset.id) setSelected(null);
      toastSuccess("Asset deleted");
      await load();
    } catch (e) {
      toastError("Delete failed", e instanceof Error ? e.message : "Error");
    } finally {
      setDeletingId(null);
    }
  }

  function copyUrl(url: string) {
    void navigator.clipboard.writeText(url);
    toastSuccess("URL copied");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 p-6 lg:flex-row lg:p-10">
      <div className="min-w-0 flex-1 space-y-6">
        <AdminPageHeader
          title="Media library"
          description="Upload, organize, and reuse images across products, vehicles, brands, and builds."
        />

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Upload
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] text-zinc-500">Folder</Label>
              <select
                value={uploadFolder}
                onChange={(e) => setUploadFolder(e.target.value as MediaFolder)}
                className={adminSelectClass}
              >
                {MEDIA_FOLDERS.map((f) => (
                  <option key={f} value={f}>
                    {MEDIA_FOLDER_LABELS[f]}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[160px] flex-1 space-y-1">
              <Label className="text-[11px] text-zinc-500">Tags (comma-separated)</Label>
              <Input
                value={uploadTags}
                onChange={(e) => setUploadTags(e.target.value)}
                placeholder="hero, studio"
                className={adminInputClass}
              />
            </div>
            <Button
              type="button"
              disabled={uploading}
              className="bg-emerald-600 hover:bg-emerald-500"
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Upload className="mr-2 size-4" />
              )}
              {uploading ? "Uploading…" : "Choose files"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              className="hidden"
              onChange={(e) => void onUpload(e.target.files)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="relative min-w-[200px] flex-1 max-w-md space-y-1">
            <Label className="text-[11px] uppercase text-zinc-500">Search</Label>
            <Search className="pointer-events-none absolute left-3 top-[34px] size-4 text-zinc-500" />
            <Input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Filename, URL, alt text…"
              className={cn(adminInputClass, "pl-9")}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] uppercase text-zinc-500">Folder</Label>
            <select
              value={folder}
              onChange={(e) => {
                setFolder(e.target.value as MediaFolder | "");
                setPage(1);
              }}
              className={adminSelectClass}
            >
              <option value="">All folders</option>
              {MEDIA_FOLDERS.map((f) => (
                <option key={f} value={f}>
                  {MEDIA_FOLDER_LABELS[f]} ({folderCounts[f] ?? 0})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] uppercase text-zinc-500">Tag</Label>
            <select
              value={tag}
              onChange={(e) => {
                setTag(e.target.value);
                setPage(1);
              }}
              className={adminSelectClass}
            >
              <option value="">All tags</option>
              {tags.map((t) => (
                <option key={t} value={t}>
                  #{t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl bg-zinc-800" />
            ))}
          </div>
        ) : assets.length === 0 ? (
          <AdminEmptyState
            icon={ImageIcon}
            title="No media yet"
            description="Upload images or use them from product and vehicle forms — they appear here automatically."
          />
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {assets.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setSelected(a)}
                  className={cn(
                    "relative aspect-square w-full overflow-hidden rounded-xl border bg-zinc-900 transition",
                    selected?.id === a.id
                      ? "border-emerald-500 ring-2 ring-emerald-500/30"
                      : "border-zinc-800 hover:border-zinc-600"
                  )}
                >
                  <Image
                    src={mediaThumbnailUrl(a.url, 400)}
                    alt={a.altText ?? a.filename}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 200px"
                    unoptimized={!a.url.includes("res.cloudinary.com")}
                  />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-zinc-950/85 px-2 py-1 text-left text-[10px] text-zinc-300">
                    {a.filename}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <AdminPaginationBar
          total={total}
          page={page}
          limit={limit}
          totalPages={totalPages}
          loading={loading}
          nounPlural="assets"
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      </div>

      <aside className="w-full shrink-0 space-y-4 lg:w-80">
        {selected ? (
          <div className="sticky top-6 space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="relative aspect-video overflow-hidden rounded-lg border border-zinc-800">
              <Image
                src={mediaThumbnailUrl(selected.url, 640)}
                alt=""
                fill
                className="object-contain"
                sizes="320px"
                unoptimized={!selected.url.includes("res.cloudinary.com")}
              />
            </div>
            <p className="truncate font-mono text-xs text-zinc-400">{selected.url}</p>
            <p className="text-xs text-zinc-500">
              {formatBytes(selected.sizeBytes)}
              {selected.width && selected.height
                ? ` · ${selected.width}×${selected.height}`
                : ""}{" "}
              · {selected.provider}
            </p>
            <div className="space-y-1">
              <Label className="text-[11px] text-zinc-500">Alt text</Label>
              <Input
                value={editAlt}
                onChange={(e) => setEditAlt(e.target.value)}
                className={adminInputClass}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-zinc-500">Tags</Label>
              <Input
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                className={adminInputClass}
                placeholder="comma-separated"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={savingMeta}
                className="bg-emerald-600 hover:bg-emerald-500"
                onClick={() => void saveMeta()}
              >
                {savingMeta ? "Saving…" : "Save metadata"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-zinc-600"
                onClick={() => copyUrl(selected.url)}
              >
                <Copy className="mr-1 size-3.5" />
                Copy URL
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={deletingId === selected.id}
                className="border-rose-900/60 text-rose-300"
                onClick={() => void deleteAsset(selected)}
              >
                <Trash2 className="mr-1 size-3.5" />
                Delete
              </Button>
            </div>
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
            Select an asset to edit metadata or copy its URL.
          </p>
        )}
        <p className="text-[11px] text-zinc-600">
          Tip: In product and vehicle forms, use <strong className="text-zinc-400">Browse library</strong> to
          reuse assets without re-uploading.
        </p>
      </aside>
    </div>
  );
}
