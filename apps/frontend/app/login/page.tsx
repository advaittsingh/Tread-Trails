import type { Metadata } from "next";
import { Suspense } from "react";

import { buildPageMetadata } from "@/lib/seo/page-metadata";

import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = buildPageMetadata({
  segmentTitle: "Login",
  description:
    "Sign in to Tread Trails — access wishlists, saved vehicles, preferred chassis, orders, and bookings tied to your account.",
  path: "/login",
  robots: { index: false, follow: true },
});

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-lg items-center px-4 py-16 sm:px-6">
      <Card className="w-full border-border/70 bg-card/70 backdrop-blur">
        <CardHeader className="space-y-2">
          <CardTitle as="h1" className="font-heading text-3xl tracking-tight">
            Welcome back
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in with your email and password to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
