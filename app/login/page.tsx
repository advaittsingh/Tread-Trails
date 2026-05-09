import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-lg items-center px-4 py-16 sm:px-6">
      <Card className="w-full border-border/70 bg-card/70 backdrop-blur">
        <CardHeader className="space-y-2">
          <CardTitle className="font-heading text-3xl tracking-tight">
            Welcome back
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            JWT session stored in an HTTP-only cookie — `/account` is guarded server-side.
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
