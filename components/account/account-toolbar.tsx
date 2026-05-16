"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/auth-context";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AccountToolbar() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="h-10 animate-pulse rounded-full bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
        Loading profile…
      </div>
    );
  }

  if (!user) {
    return (
      <Link
        href="/login?redirect=/account"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-sm text-muted-foreground">
        Signed in as{" "}
        <span className="font-medium text-foreground">{user.name}</span>
        {user.role === "admin" ? (
          <span className="ml-2 rounded-full border border-primary/30 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">
            Admin
          </span>
        ) : null}
      </p>
      {user.role === "admin" ? (
        <Link
          href="/admin"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Admin panel
        </Link>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={async () => {
          await logout();
          router.push("/login");
          router.refresh();
        }}
      >
        Sign out
      </Button>
    </div>
  );
}
