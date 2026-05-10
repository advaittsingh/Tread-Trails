"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

import { getProductBySlug } from "@/data/index";
import { useConfirmation } from "@/contexts/confirmation-context";
import { MAX_COMPARE, useCompare } from "@/contexts/compare-context";
import { toastSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

import { Button, buttonVariants } from "@/components/ui/button";

export function ComparisonTray() {
  const pathname = usePathname();
  const { confirmAction } = useConfirmation();
  const { slugs, hydrated, count, remove, clear } = useCompare();

  async function confirmClear() {
    const ok = await confirmAction({
      title: "Clear compare list?",
      description: "You can add products again from any product card.",
      confirmLabel: "Clear list",
    });
    if (ok) {
      clear();
      toastSuccess("Compare list cleared");
    }
  }

  const isAdmin = pathname?.startsWith("/admin") ?? false;
  const onComparePage = pathname === "/compare";

  if (isAdmin || !hydrated || count === 0) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.25)] backdrop-blur-md transition-[transform,opacity]",
        onComparePage && "translate-y-full opacity-0 pointer-events-none"
      )}
      role="region"
      aria-label="Product comparison tray"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto sm:gap-3">
          <p className="hidden shrink-0 text-[11px] font-medium tracking-widest text-muted-foreground uppercase sm:block">
            Compare
          </p>
          <span className="shrink-0 rounded-full border border-border/80 bg-muted/50 px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">
            {count}/{MAX_COMPARE}
          </span>
          <ul className="flex shrink-0 items-center gap-2">
            {slugs.map((slug) => {
              const p = getProductBySlug(slug);
              const thumb = p?.images[0];
              const name = p?.name ?? slug;
              return (
                <li
                  key={slug}
                  className="relative shrink-0 rounded-lg border border-border/70 bg-card shadow-card"
                >
                  <div className="flex items-center gap-1 pr-1">
                    <Link
                      href={`/product/${slug}`}
                      className="relative block size-11 overflow-hidden rounded-md sm:size-12"
                      title={name}
                      aria-label={`View ${name}`}
                    >
                      {thumb ? (
                        <Image
                          src={thumb}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center bg-muted text-[10px] text-muted-foreground">
                          —
                        </span>
                      )}
                    </Link>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label={`Remove ${name} from compare`}
                      onClick={() => remove(slug)}
                    >
                      <X className="size-3.5" aria-hidden />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row sm:items-center">
          <Link
            href="/compare"
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "inline-flex h-7 items-center justify-center shadow-none sm:h-9"
            )}
          >
            Open table
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground sm:h-9"
            onClick={() => void confirmClear()}
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
