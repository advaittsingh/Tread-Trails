"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export const adminInputClass =
  "h-10 border-zinc-700/80 bg-zinc-900/80 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-emerald-500/35";

export const adminSelectClass =
  "h-10 w-full rounded-lg border border-zinc-700/80 bg-zinc-900/80 px-3 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500/35";

export const adminTextareaClass =
  "w-full resize-y rounded-lg border border-zinc-700/80 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35";

export const adminSheetContentClass =
  "flex h-full w-full max-w-full flex-col gap-0 border-zinc-800 bg-zinc-950 p-0 text-zinc-100 sm:max-w-2xl lg:max-w-[44rem]";

type AdminPageHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function AdminPageHeader({ title, description, action }: AdminPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-heading text-2xl tracking-tight text-white md:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

type AdminEditSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  formError?: string | null;
  loading?: boolean;
  loadingSkeleton?: ReactNode;
  footer: ReactNode;
  children: ReactNode;
};

export function AdminEditSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  formError,
  loading,
  loadingSkeleton,
  footer,
  children,
}: AdminEditSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton
        className={adminSheetContentClass}
      >
        <SheetHeader className="shrink-0 space-y-1 border-b border-zinc-800 px-6 py-5 text-left">
          <SheetTitle className="font-heading text-xl tracking-tight text-white">
            {title}
          </SheetTitle>
          {subtitle ? (
            <p className="text-sm leading-relaxed text-zinc-500">{subtitle}</p>
          ) : null}
        </SheetHeader>

        {formError ? (
          <p className="mx-6 mt-4 shrink-0 rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {formError}
          </p>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {loading ? loadingSkeleton : children}
        </div>

        <SheetFooter className="shrink-0 flex-row justify-end gap-2 border-t border-zinc-800 bg-zinc-950/95 px-6 py-4 backdrop-blur-sm">
          {footer}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function AdminSheetFooterButtons({
  onCancel,
  onSave,
  saving,
  saveDisabled,
  saveLabel = "Save",
}: {
  onCancel: () => void;
  onSave: () => void;
  saving?: boolean;
  saveDisabled?: boolean;
  saveLabel?: string;
}) {
  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="border-zinc-600 bg-zinc-950 text-zinc-200"
        onClick={onCancel}
      >
        Cancel
      </Button>
      <Button
        type="button"
        disabled={saving || saveDisabled}
        className="min-w-[100px] bg-emerald-600 text-white hover:bg-emerald-500"
        onClick={onSave}
      >
        {saving ? "Saving…" : saveLabel}
      </Button>
    </>
  );
}

type AdminFormSectionProps = {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
};

export function AdminFormSection({
  title,
  description,
  defaultOpen = true,
  children,
  className,
}: AdminFormSectionProps) {
  return (
    <details
      open={defaultOpen}
      className={cn(
        "group overflow-hidden rounded-xl border border-zinc-800/90 bg-zinc-900/25",
        className
      )}
    >
      <summary className="cursor-pointer list-none px-4 py-3.5 marker:content-none [&::-webkit-details-marker]:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-zinc-100">{title}</p>
            {description ? (
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                {description}
              </p>
            ) : null}
          </div>
          <span className="text-xs text-zinc-600 transition group-open:rotate-180">
            ▾
          </span>
        </div>
      </summary>
      <div className="space-y-4 border-t border-zinc-800/70 px-4 py-4">{children}</div>
    </details>
  );
}

export function AdminFieldGrid({
  children,
  cols = 2,
}: {
  children: ReactNode;
  cols?: 1 | 2;
}) {
  return (
    <div
      className={cn(
        "grid gap-4",
        cols === 2 ? "sm:grid-cols-2" : "grid-cols-1"
      )}
    >
      {children}
    </div>
  );
}

export function AdminField({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-medium text-zinc-300">
        {label}
      </Label>
      {children}
      {hint ? (
        <p className="text-[11px] leading-relaxed text-zinc-600">{hint}</p>
      ) : null}
    </div>
  );
}

export function AdminFormStack({ children }: { children: ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}
