"use client";

import { useRef, useState } from "react";
import { FolderOpen, ImagePlus, Loader2, X } from "lucide-react";

import { uploadMediaFile } from "@/lib/media/client-upload";
import { mediaThumbnailUrl } from "@/lib/media/optimize-url";
import { toastError } from "@/lib/toast";
import { cn } from "@/lib/utils";

import { AdminMediaPicker } from "@/components/admin/admin-media-picker";
import { adminInputClass } from "@/components/admin/admin-form-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdminImageFieldProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  hint?: string;
  aspectClass?: string;
};

export function AdminImageField({
  label,
  value,
  onChange,
  folder = "uploads",
  hint,
  aspectClass = "aspect-video",
}: AdminImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  async function onPick(file: File) {
    setUploading(true);
    try {
      const asset = await uploadMediaFile(file, { folder });
      onChange(asset.url);
    } catch (e) {
      toastError(
        "Upload failed",
        e instanceof Error ? e.message : "Could not upload image"
      );
    } finally {
      setUploading(false);
    }
  }

  const previewSrc = value ? mediaThumbnailUrl(value, 800) : "";

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-zinc-300">{label}</p>
      {value ? (
        <div
          className={cn(
            "relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900",
            aspectClass
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewSrc || value} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            aria-label="Remove image"
            className="absolute right-2 top-2 rounded-lg bg-zinc-950/80 p-1.5 text-zinc-300 ring-1 ring-zinc-700 hover:text-white"
            onClick={() => onChange("")}
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50",
            aspectClass
          )}
        >
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center gap-2 text-zinc-500 transition hover:text-zinc-300"
          >
            {uploading ? (
              <Loader2 className="size-6 animate-spin text-emerald-400" />
            ) : (
              <ImagePlus className="size-6" />
            )}
            <span className="text-xs">{uploading ? "Uploading…" : "Upload image"}</span>
          </button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-zinc-600 bg-zinc-950 text-zinc-200"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <ImagePlus className="mr-1.5 size-3.5" />
          Upload
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-zinc-600 bg-zinc-950 text-zinc-200"
          onClick={() => setPickerOpen(true)}
        >
          <FolderOpen className="mr-1.5 size-3.5" />
          Browse library
        </Button>
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or paste image URL (legacy / external)"
        className={adminInputClass}
      />
      {hint ? <p className="text-[11px] text-zinc-600">{hint}</p> : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onPick(file);
          e.target.value = "";
        }}
      />
      <AdminMediaPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        folder={folder}
        onSelect={(url) => onChange(url)}
        title={`Choose image — ${folder}`}
      />
    </div>
  );
}

type AdminImageListFieldProps = {
  label: string;
  values: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  hint?: string;
};

export function AdminImageListField({
  label,
  values,
  onChange,
  folder = "uploads",
  hint,
}: AdminImageListFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  async function onPick(file: File) {
    setUploading(true);
    try {
      const asset = await uploadMediaFile(file, { folder });
      onChange([...values, asset.url]);
    } catch (e) {
      toastError(
        "Upload failed",
        e instanceof Error ? e.message : "Could not upload image"
      );
    } finally {
      setUploading(false);
    }
  }

  function removeAt(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-zinc-300">{label}</p>
      {values.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {values.map((url, i) => (
            <li
              key={`${url}-${i}`}
              className="relative aspect-video overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaThumbnailUrl(url, 480) || url}
                alt=""
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                aria-label="Remove image"
                className="absolute right-2 top-2 rounded-lg bg-zinc-950/80 p-1.5 text-zinc-300 ring-1 ring-zinc-700 hover:text-white"
                onClick={() => removeAt(i)}
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          className="border-zinc-600 bg-zinc-950 text-zinc-200"
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <ImagePlus className="mr-2 size-4" />
          )}
          Add image
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-zinc-600 bg-zinc-950 text-zinc-200"
          onClick={() => setPickerOpen(true)}
        >
          <FolderOpen className="mr-2 size-4" />
          From library
        </Button>
      </div>
      {hint ? <p className="text-[11px] text-zinc-600">{hint}</p> : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onPick(file);
          e.target.value = "";
        }}
      />
      <AdminMediaPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        folder={folder}
        onSelect={(url) => onChange([...values, url])}
        title={`Add from library — ${folder}`}
      />
    </div>
  );
}
