import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/ui/skeleton";

export function PageChrome({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8", className)}
    >
      {children}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <PageChrome>
      <div className="mb-8 flex gap-2">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-40 rounded-full" />
      </div>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
        <Skeleton className="aspect-square w-full rounded-xl lg:max-h-none" />
        <div className="space-y-8">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-7 w-32 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-28 rounded-full" />
          </div>
          <Skeleton className="h-10 max-w-xl rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-11 max-w-xs rounded-lg" />
          <div className="flex gap-3">
            <Skeleton className="h-11 flex-1 rounded-lg sm:max-w-[180px]" />
            <Skeleton className="h-11 flex-1 rounded-lg sm:max-w-[180px]" />
          </div>
        </div>
      </div>
    </PageChrome>
  );
}

export function BuildsGridSkeleton() {
  return (
    <PageChrome>
      <div className="mb-14 space-y-4">
        <Skeleton className="h-4 w-32 rounded-full" />
        <Skeleton className="h-12 max-w-xl rounded-lg" />
        <Skeleton className="h-16 max-w-3xl rounded-lg" />
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card"
          >
            <Skeleton className="aspect-[5/4] w-full rounded-none" />
            <div className="space-y-3 p-6">
              <Skeleton className="h-4 w-20 rounded-full" />
              <Skeleton className="h-8 w-full max-w-[280px] rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </PageChrome>
  );
}

export function BuildDetailSkeleton() {
  return (
    <article className="pb-24">
      <header className="border-b border-border/60">
        <PageChrome className="pb-12">
          <div className="mb-8 flex gap-2">
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-28 rounded-full" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-7 w-36 rounded-full" />
            <Skeleton className="h-7 w-28 rounded-full" />
          </div>
          <Skeleton className="mt-8 h-14 max-w-3xl rounded-lg md:h-16" />
          <Skeleton className="mt-6 h-24 max-w-2xl rounded-lg" />
          <div className="mt-8 flex flex-wrap gap-3">
            <Skeleton className="h-11 w-40 rounded-lg" />
            <Skeleton className="h-11 w-48 rounded-lg" />
          </div>
        </PageChrome>
      </header>
      <div className="mx-auto grid max-w-7xl gap-px bg-border/60 px-4 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pt-12">
        <Skeleton className="aspect-[5/4] w-full lg:rounded-tl-2xl" />
        <Skeleton className="aspect-[5/4] w-full lg:rounded-tr-2xl" />
      </div>
      <PageChrome className="space-y-12 pt-16">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-40 w-full max-w-3xl rounded-xl" />
        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[380px] rounded-2xl" />
          ))}
        </div>
      </PageChrome>
    </article>
  );
}

export function CheckoutSkeleton() {
  return (
    <PageChrome>
      <div className="mx-auto mb-14 max-w-2xl space-y-4 text-center">
        <Skeleton className="mx-auto h-4 w-40 rounded-full" />
        <Skeleton className="mx-auto h-12 w-full max-w-md rounded-lg" />
        <Skeleton className="mx-auto h-16 w-full rounded-lg" />
      </div>
      <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="space-y-6 rounded-2xl border border-border/70 bg-card p-6 shadow-card">
          <Skeleton className="h-8 w-48 rounded-lg" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
        <aside className="space-y-6 rounded-2xl border border-border/70 bg-card p-6 shadow-card lg:sticky lg:top-28">
          <Skeleton className="h-8 w-40 rounded-lg" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </aside>
      </div>
    </PageChrome>
  );
}

export function AccountSkeleton() {
  return (
    <PageChrome>
      <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-4">
          <Skeleton className="h-4 w-36 rounded-full" />
          <Skeleton className="h-12 w-full max-w-sm rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>
      <div className="flex flex-wrap gap-2 border-b border-border/60 pb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-full" />
        ))}
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </PageChrome>
  );
}

export function BookingSkeleton() {
  return (
    <PageChrome>
      <div className="mx-auto mb-14 max-w-xl space-y-4 text-center">
        <Skeleton className="mx-auto h-4 w-32 rounded-full" />
        <Skeleton className="mx-auto h-10 w-full rounded-lg" />
        <Skeleton className="mx-auto h-16 w-full rounded-lg" />
      </div>
      <div className="mx-auto max-w-xl space-y-6 rounded-xl border border-border/70 bg-card p-8 shadow-card">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
        <div className="flex justify-end gap-3 pt-4">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>
    </PageChrome>
  );
}

export function AdminShellSkeleton() {
  return (
    <div className="min-h-[50vh] space-y-8 p-6 text-zinc-100">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 rounded-lg bg-zinc-800" />
        <Skeleton className="h-4 w-96 max-w-full rounded-md bg-zinc-800" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl bg-zinc-800/90" />
        ))}
      </div>
      <Skeleton className="h-72 w-full rounded-xl bg-zinc-800/70" />
    </div>
  );
}
