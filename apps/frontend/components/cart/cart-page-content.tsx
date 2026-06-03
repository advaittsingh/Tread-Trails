"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";

import { useConfirmation } from "@/contexts/confirmation-context";
import { formatInr } from "@/lib/format";
import { toastSuccess } from "@/lib/toast";
import { useCart } from "@/contexts/cart-context";

import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type CartPageContentProps = {
  variant?: "page" | "drawer";
  onNavigate?: () => void;
};

export function CartPageContent({
  variant = "page",
  onNavigate,
}: CartPageContentProps) {
  const isDrawer = variant === "drawer";
  const { confirmDelete } = useConfirmation();
  const { lines, setQty, removeLine, subtotal, hasPoaLines } = useCart();

  async function confirmRemoveLine(lineId: string, name: string) {
    const ok = await confirmDelete({
      title: "Remove from cart?",
      description: `${name} will be removed from your cart.`,
      confirmLabel: "Remove",
    });
    if (ok) {
      removeLine(lineId);
      toastSuccess("Removed from cart");
    }
  }

  if (lines.length === 0) {
    return (
      <div
        className={cn(
          "text-center",
          isDrawer
            ? "flex flex-1 flex-col items-center justify-center py-10"
            : "mx-auto max-w-lg rounded-2xl border border-dashed border-border/80 bg-card px-8 py-16 shadow-card"
        )}
      >
        <p className="font-heading text-xl tracking-tight">Your cart is empty</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse the catalog and add expedition-ready upgrades.
        </p>
        <Link
          href="/products"
          className={cn(buttonVariants(), "mt-8 inline-flex")}
          onClick={onNavigate}
        >
          Shop products
        </Link>
      </div>
    );
  }

  const orderSummary = (
    <aside
      className={cn(
        "space-y-6 rounded-2xl border border-border/70 bg-card p-6 shadow-card",
        isDrawer ? "shrink-0 border-x-0 border-b-0 shadow-none" : "sticky top-28"
      )}
    >
      <h2 className="font-heading text-lg tracking-wide uppercase">Order summary</h2>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums text-foreground">
            {hasPoaLines && subtotal === 0 ? "—" : formatInr(subtotal) ?? "—"}
          </span>
        </div>
        {hasPoaLines ? (
          <p className="text-xs text-muted-foreground">
            Some items require a custom quote — totals finalize after studio review.
          </p>
        ) : null}
      </div>
      <Separator />
      <div className="flex justify-between font-heading text-xl tracking-tight">
        <span>Estimated total</span>
        <span className="tabular-nums">
          {hasPoaLines && subtotal === 0 ? "Quote" : formatInr(subtotal) ?? "—"}
        </span>
      </div>
      <Link
        href="/checkout"
        className={cn(buttonVariants({ size: "lg" }), "w-full justify-center text-base")}
        onClick={onNavigate}
      >
        Proceed to checkout
      </Link>
      <Link
        href="/products"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "w-full justify-center"
        )}
        onClick={onNavigate}
      >
        Continue shopping
      </Link>
    </aside>
  );

  const lineList = (
    <ul
      className={cn("space-y-4", isDrawer && "min-h-0 flex-1 overflow-y-auto pr-1")}
      aria-label="Cart items"
    >
      {lines.map((line) => (
        <li
          key={line.lineId}
          className={cn(
            "flex gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-card transition hover:shadow-card-hover",
            isDrawer && "shadow-none"
          )}
        >
          <Link
            href={`/product/${line.productSlug}`}
            className={cn(
              "relative shrink-0 overflow-hidden rounded-xl bg-muted",
              isDrawer ? "size-20" : "size-24 sm:size-28"
            )}
            aria-label={`View ${line.name}`}
            onClick={onNavigate}
          >
            <Image
              src={
                line.image ||
                "https://images.unsplash.com/photo-1489827908967-5dcc493046dc?w=200&q=80"
              }
              alt={line.name}
              fill
              className="object-cover"
              sizes={isDrawer ? "80px" : "112px"}
            />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div>
              <Link
                href={`/product/${line.productSlug}`}
                className={cn(
                  "font-heading leading-snug tracking-tight hover:text-primary",
                  isDrawer ? "text-base" : "text-lg"
                )}
                onClick={onNavigate}
              >
                {line.name}
              </Link>
              <p className="text-xs text-muted-foreground">{line.variantLabel}</p>
            </div>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center rounded-full border border-border/80 bg-muted/40 p-1 shadow-inner">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Decrease quantity of ${line.name}`}
                  onClick={() => setQty(line.lineId, line.quantity - 1)}
                >
                  <Minus className="size-4" aria-hidden />
                </Button>
                <span className="min-w-8 px-2 text-center text-sm tabular-nums">
                  {line.quantity}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Increase quantity of ${line.name}`}
                  onClick={() => setQty(line.lineId, line.quantity + 1)}
                >
                  <Plus className="size-4" aria-hidden />
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium tabular-nums">
                  {line.unitPrice != null
                    ? formatInr(line.unitPrice * line.quantity)
                    : "Quoted"}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${line.name} from cart`}
                  onClick={() => void confirmRemoveLine(line.lineId, line.name)}
                >
                  <Trash2 className="size-4 text-muted-foreground" aria-hidden />
                </Button>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );

  if (isDrawer) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {lineList}
        {orderSummary}
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
      {lineList}
      {orderSummary}
    </div>
  );
}
