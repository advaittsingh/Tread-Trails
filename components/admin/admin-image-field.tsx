"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";

import { toastError } from "@/lib/toast";
import { cn } from "@/lib/utils";

import { adminInputClass } from "@/components/admin/admin-form-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

async function uploadImage(file: File, folder: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  const res = await fetch("/api/admin/upload", {
    method: "POST",
    body: fd,
    credentials: "include",
  });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  if (!data.url) throw new Error("No URL returned");
  return data.url;
}

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

  async function onPick(file: File) {
    setUploading(true);
    try {
      const url = await uploadImage(file, folder);
      onChange(url);
    } catch (e) {
      toastError(
        "Upload failed",
        e instanceof Error ? e.message : "Could not upload image"
      );
    } finally {
      setUploading(false);
    }
  }

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
          <img src={value} alt="" className="h-full w-full object-cover" />
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
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 text-zinc-500 transition hover:border-emerald-600/50 hover:bg-zinc-900 hover:text-zinc-300",
            aspectClass
          )}
        >
          {uploading ? (
            <Loader2 className="size-6 animate-spin text-emerald-400" />
          ) : (
            <ImagePlus className="size-6" />
          )}
          <span className="text-xs">{uploading ? "Uploading…" : "Upload image"}</span>
        </button>
      )}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or paste image URL"
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

  async function onPick(file: File) {
    setUploading(true);
    try {
      const url = await uploadImage(file, folder);
      onChange([...values, url]);
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
              <img src={url} alt="" className="h-full w-full object-cover" />
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
    </div>
  );
}
