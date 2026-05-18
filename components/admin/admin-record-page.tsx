"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type AdminRecordPageProps = {
  listHref: string;
  listLabel: string;
  title: string;
  subtitle?: string;
  formError?: string | null;
  loading?: boolean;
  saving?: boolean;
  onSave: () => void;
  onDelete?: () => void;
  deleting?: boolean;
  media?: ReactNode;
  children: ReactNode;
};

export function AdminRecordPage({
  listHref,
  listLabel,
  title,
  subtitle,
  formError,
  loading,
  saving,
  onSave,
  onDelete,
  deleting,
  media,
  children,
}: AdminRecordPageProps) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 pb-24 lg:p-10">
      <Link
        href={listHref}
        className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-zinc-200"
      >
        <ArrowLeft className="size-4" />
        {listLabel}
      </Link>

      <header className="space-y-1 border-b border-zinc-800 pb-6">
        <h1 className="font-heading text-2xl tracking-tight text-white md:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-500">
            {subtitle}
          </p>
        ) : null}
      </header>

      {formError ? (
        <p className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {formError}
        </p>
      ) : null}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-xl bg-zinc-800" />
          <Skeleton className="h-64 w-full rounded-xl bg-zinc-800" />
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,360px)_1fr]">
          {media ? (
            <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
              {media}
            </aside>
          ) : null}
          <div className="min-w-0 space-y-4">{children}</div>
        </div>
      )}

      {!loading ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-6">
          <div>
            {onDelete ? (
              <Button
                type="button"
                variant="outline"
                disabled={saving || deleting}
                className="border-rose-900/60 text-rose-300 hover:bg-rose-950/40"
                onClick={onDelete}
              >
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-zinc-600 bg-zinc-950 text-zinc-200"
              disabled={saving}
              onClick={() => router.push(listHref)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving}
              className="min-w-[120px] bg-brand-maroon-light text-white hover:bg-brand-maroon"
              onClick={onSave}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
