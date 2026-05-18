"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export {
  AdminField,
  AdminFieldGrid,
  AdminFormSection,
  AdminFormStack,
  AdminPageHeader,
  adminInputClass,
  adminSelectClass,
  adminSheetContentClass,
  adminTextareaClass,
} from "@/components/admin/admin-form-ui";

import {
  adminSheetContentClass,
} from "@/components/admin/admin-form-ui";

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
        className="min-w-[100px] bg-brand-maroon-light text-white hover:bg-brand-maroon"
        onClick={onSave}
      >
        {saving ? "Saving…" : saveLabel}
      </Button>
    </>
  );
}
