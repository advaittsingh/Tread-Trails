"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Variant = "destructive" | "default";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  /** Merged into `DialogContent` (e.g. dark zinc shell on admin routes). */
  contentClassName?: string;
};

type Pending = ConfirmOptions & {
  resolve: (confirmed: boolean) => void;
  settled: boolean;
};

type ConfirmationContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** Delete-style destructive confirmation */
  confirmDelete: (options: Omit<ConfirmOptions, "variant">) => Promise<boolean>;
  /** Neutral secondary action confirmation */
  confirmAction: (options: Omit<ConfirmOptions, "variant">) => Promise<boolean>;
};

const ConfirmationContext = createContext<ConfirmationContextValue | null>(
  null
);

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);

  const settle = useCallback((confirmed: boolean) => {
    setPending((p) => {
      if (!p || p.settled) return null;
      p.settled = true;
      p.resolve(confirmed);
      return null;
    });
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve, settled: false });
    });
  }, []);

  const confirmDelete = useCallback(
    (options: Omit<ConfirmOptions, "variant">) =>
      confirm({
        ...options,
        variant: "destructive",
        confirmLabel: options.confirmLabel ?? "Delete",
      }),
    [confirm]
  );

  const confirmAction = useCallback(
    (options: Omit<ConfirmOptions, "variant">) =>
      confirm({
        ...options,
        variant: "default",
        confirmLabel: options.confirmLabel ?? "Continue",
      }),
    [confirm]
  );

  const value = useMemo(
    () => ({ confirm, confirmDelete, confirmAction }),
    [confirm, confirmDelete, confirmAction]
  );

  const variant = pending?.variant ?? "default";
  const open = Boolean(pending);

  return (
    <ConfirmationContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={(next) => !next && settle(false)}>
        {pending ? (
          <DialogContent
            showCloseButton={false}
            className={cn(pending.contentClassName)}
          >
            <DialogHeader>
              <DialogTitle>{pending.title}</DialogTitle>
              {pending.description ? (
                <DialogDescription>{pending.description}</DialogDescription>
              ) : null}
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => settle(false)}
              >
                {pending.cancelLabel ?? "Cancel"}
              </Button>
              <Button
                type="button"
                variant={variant === "destructive" ? "destructive" : "default"}
                onClick={() => settle(true)}
              >
                {pending.confirmLabel ??
                  (variant === "destructive" ? "Delete" : "Continue")}
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  const ctx = useContext(ConfirmationContext);
  if (!ctx) {
    throw new Error("useConfirmation must be used within ConfirmationProvider");
  }
  return ctx;
}
