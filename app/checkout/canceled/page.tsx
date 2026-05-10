import type { Metadata } from "next";
import Link from "next/link";

import { buildPageMetadata } from "@/lib/seo/page-metadata";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = buildPageMetadata({
  segmentTitle: "Checkout canceled",
  description:
    "Checkout was canceled — your cart is unchanged. Return to cart or keep browsing expedition upgrades.",
  path: "/checkout/canceled",
  robots: { index: false, follow: true },
});

export default function CheckoutCanceledPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Card className="mx-auto max-w-lg border-border/70 shadow-card">
        <CardHeader>
          <CardTitle as="h1" className="font-heading text-2xl tracking-tight">
            Checkout canceled
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          You exited before completing payment. Nothing was charged — items remain in your cart.
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3">
          <Link href="/cart" className={cn(buttonVariants({ variant: "default" }))}>
            Back to cart
          </Link>
          <Link
            href="/products"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Browse products
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
