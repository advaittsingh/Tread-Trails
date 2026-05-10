import type { Metadata } from "next";
import { Suspense } from "react";

import { buildPageMetadata } from "@/lib/seo/page-metadata";

import { SignupForm } from "@/components/auth/signup-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = buildPageMetadata({
  segmentTitle: "Sign up",
  description:
    "Create a Tread Trails account — save vehicles and wishlists, remember your chassis across visits, and track orders and bookings.",
  path: "/signup",
  robots: { index: false, follow: true },
});

export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-lg items-center px-4 py-16 sm:px-6">
      <Card className="w-full border-border/70 bg-card/70 backdrop-blur">
        <CardHeader className="space-y-2">
          <CardTitle as="h1" className="font-heading text-3xl tracking-tight">
            Join the roster
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Creates your profile and drops you into the driver lounge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
            <SignupForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
