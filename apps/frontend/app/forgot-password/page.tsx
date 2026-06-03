import type { Metadata } from "next";
import { Suspense } from "react";

import { buildPageMetadata } from "@/lib/seo/page-metadata";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const description =
  "Reset your Tread Trails password. Enter your email — if an account exists, we send a secure link that expires in 24 hours.";

export const metadata: Metadata = buildPageMetadata({
  segmentTitle: "Forgot password",
  description,
  path: "/forgot-password",
  robots: { index: false, follow: true },
});

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-lg items-center px-4 py-16 sm:px-6">
      <Card className="w-full border-border/70 bg-card/70 backdrop-blur">
        <CardHeader className="space-y-2">
          <CardTitle as="h1" className="font-heading text-3xl tracking-tight">
            Reset password
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            We&apos;ll email you a one-time link if this address matches an account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
            <ForgotPasswordForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
