import { useCallback, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminQuery } from "@/api/admin";
import { apiFetch, apiFetchJson } from "@/api/client";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Copy, Trash2, Upload } from "lucide-react";

type MediaAsset = {
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
  createdAt: string;
};

type MediaResponse = {
  assets: MediaAsset[];
  total: number;
  page: number;
  totalPages: number;
  folderCounts: Record<string, number>;
};

const FOLDERS = ["uploads", "products", "vehicles", "brands", "builds", "marketing"];

export default function MediaPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState("");
  const [uploadFolder, setUploadFolder] = useState("uploads");
  const [altText, setAltText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<MediaAsset | null>(null);
  const [replaceTarget, setReplaceTarget] = useState<MediaAsset | null>(null);

  const q = useAdminQuery<MediaResponse>("/api/admin/media", {
    page,
    limit: 24,
    search: search || undefined,
    folder: folder || undefined,
  });

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      for (const file of list) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", uploadFolder);
        if (altText) fd.append("altText", altText);
        const res = await apiFetch("/api/admin/media", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Upload failed");
      }
      void qc.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: `Uploaded ${list.length} file(s)` });
    },
    [altText, qc, toast, uploadFolder]
  );

  const uploadMut = useMutation({
    mutationFn: (files: FileList) => uploadFiles(files),
    onError: (e: Error) =>
      toast({ title: "Upload failed", description: e.message, variant: "destructive" }),
  });

  const patchMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      apiFetchJson(`/api/admin/media/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: "Updated" });
    },
    onError: (e: Error) =>
      toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) =>
      apiFetchJson(`/api/admin/media/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      setPreview(null);
      toast({ title: "Deleted" });
    },
    onError: (e: Error) =>
      toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  const replaceMut = useMutation({
    mutationFn: async ({ asset, file }: { asset: MediaAsset; file: File }) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", asset.folder);
      if (asset.altText) fd.append("altText", asset.altText);
      const res = await apiFetch("/api/admin/media", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      await apiFetchJson(`/api/admin/media/${asset.id}`, { method: "DELETE" });
      return json;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      setReplaceTarget(null);
      toast({ title: "Replaced asset" });
    },
    onError: (e: Error) =>
      toast({ title: "Replace failed", description: e.message, variant: "destructive" }),
  });

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadMut.mutate(e.dataTransfer.files);
  };

  return (
    <>
      <CardContent className="px-3 lg:px-6 pb-4 space-y-4">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver ? "border-stone-800 bg-stone-50" : "border-stone-300"
          }`}
        >
          <Upload className="mx-auto h-8 w-8 text-stone-400 mb-2" />
          <p className="text-sm text-stone-600 mb-3">
            Drag & drop images here, or choose files
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-3">
            <Select value={uploadFolder} onValueChange={setUploadFolder}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FOLDERS.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="max-w-xs"
              placeholder="Alt text (optional)"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
            />
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && uploadMut.mutate(e.target.files)}
          />
          <Button
            size="sm"
            disabled={uploadMut.isPending}
            onClick={() => fileRef.current?.click()}
          >
            Upload files
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <Input
            className="max-w-xs"
            placeholder="Search…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <Select value={folder || "all"} onValueChange={(v) => { setFolder(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Folder" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All folders</SelectItem>
              {FOLDERS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f} ({q.data?.folderCounts[f] ?? 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>

      <CardContent className="px-3 lg:px-6 pb-6">
        {q.isLoading ? (
          <p className="text-sm text-stone-600">Loading…</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {(q.data?.assets ?? []).map((asset) => (
              <div
                key={asset.id}
                className="group relative rounded-lg border border-stone-200 overflow-hidden cursor-pointer"
                onClick={() => setPreview(asset)}
              >
                <img
                  src={asset.url}
                  alt={asset.altText ?? asset.filename}
                  className="aspect-square object-cover w-full"
                />
                <div className="p-2 text-xs">
                  <p className="truncate font-medium">{asset.filename}</p>
                  <Badge variant="secondary" className="mt-1">{asset.folder}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {q.data ? (
        <AdminPagination
          page={q.data.page}
          totalPages={q.data.totalPages}
          total={q.data.total}
          onPageChange={setPage}
        />
      ) : null}

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {preview ? (
            <>
              <DialogHeader>
                <DialogTitle>{preview.filename}</DialogTitle>
              </DialogHeader>
              <img src={preview.url} alt={preview.altText ?? ""} className="w-full rounded-md" />
              <div className="space-y-3 text-sm">
                <p>{preview.mimeType} · {(preview.sizeBytes / 1024).toFixed(1)} KB</p>
                {preview.width && preview.height ? (
                  <p>{preview.width} × {preview.height}px</p>
                ) : null}
                <div className="space-y-1">
                  <Label>Alt text</Label>
                  <Textarea
                    defaultValue={preview.altText ?? ""}
                    id="preview-alt"
                    rows={2}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      const el = document.getElementById("preview-alt") as HTMLTextAreaElement;
                      patchMut.mutate({ id: preview.id, body: { altText: el.value || null } });
                    }}
                  >
                    Save alt text
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      void navigator.clipboard.writeText(preview.url);
                      toast({ title: "URL copied" });
                    }}
                  >
                    <Copy className="h-4 w-4 mr-1" /> Copy URL
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setReplaceTarget(preview);
                      replaceRef.current?.click();
                    }}
                  >
                    Replace
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMut.mutate(preview.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <input
        ref={replaceRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && replaceTarget) replaceMut.mutate({ asset: replaceTarget, file });
          e.target.value = "";
        }}
      />
    </>
  );
}
