import type { Metadata } from "next";
import Link from "next/link";

import { absoluteUrl } from "@/lib/site";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Checkout canceled",
  alternates: { canonical: absoluteUrl("/checkout/canceled") },
};

export default function CheckoutCanceledPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Card className="mx-auto max-w-lg border-border/70 shadow-card">
        <CardHeader>
          <CardTitle className="font-heading text-2xl tracking-tight">
            Checkout canceled
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No charge was made. Your cart is unchanged — jump back in whenever you are ready.
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          <Link href="/checkout" className={cn(buttonVariants(), "w-full justify-center")}>
            Return to checkout
          </Link>
          <Link href="/cart" className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center")}>
            Review cart
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
