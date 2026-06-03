import type { Metadata } from "next";
import { Suspense } from "react";

import { buildPageMetadata } from "@/lib/seo/page-metadata";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const description =
  "Choose a new password for your Tread Trails account using the link from your email.";

export const metadata: Metadata = buildPageMetadata({
  segmentTitle: "Reset password",
  description,
  path: "/reset-password",
  robots: { index: false, follow: true },
});

function ResetFallback() {
  return <p className="text-sm text-muted-foreground">Loading…</p>;
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-lg items-center px-4 py-16 sm:px-6">
      <Card className="w-full border-border/70 bg-card/70 backdrop-blur">
        <CardHeader className="space-y-2">
          <CardTitle as="h1" className="font-heading text-3xl tracking-tight">
            New password
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter a new password for your account. Minimum 8 characters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<ResetFallback />}>
            <ResetPasswordForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
