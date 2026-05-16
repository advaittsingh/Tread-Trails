"use client";

import Link from "next/link";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CartPageContent } from "@/components/cart/cart-page-content";

type CartSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CartSheet({ open, onOpenChange }: CartSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 border-border/70 bg-background p-0 sm:max-w-md md:max-w-lg"
        aria-describedby={undefined}
      >
        <SheetHeader className="shrink-0 border-b border-border/60 px-5 py-4 text-left">
          <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Checkout
          </p>
          <SheetTitle className="font-heading text-2xl tracking-tight">
            Your cart
          </SheetTitle>
          <SheetDescription className="text-sm leading-relaxed">
            Review quantities before proceeding — totals respect studio quoting rules
            for POA items.
          </SheetDescription>
          <Link
            href="/cart"
            onClick={() => onOpenChange(false)}
            className="mt-1 w-fit text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            Open full cart page
          </Link>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-4">
          <CartPageContent
            variant="drawer"
            onNavigate={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
