"use client";

import { useEffect } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { Button, buttonVariants } from "@/components/ui/button";

type RouteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
  /** Page-specific headline */
  title?: string;
  /** Override visible message (defaults to error.message) */
  description?: string;
  variant?: "marketing" | "admin";
  /** Extra links beside “Try again” */
  links?: { href: string; label: string }[];
};

export function RouteError({
  error,
  reset,
  title = "Something went wrong",
  description,
  variant = "marketing",
  links = [],
}: RouteErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

  const msg = description ?? error.message;

  return (
    <div
      className={cn(
        "mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center",
        variant === "admin" && "max-w-2xl text-zinc-100"
      )}
      role="alert"
    >
      <h1 className="font-heading text-2xl tracking-tight md:text-3xl">
        {title}
      </h1>
      <p
        className={cn(
          "mt-4 text-sm leading-relaxed text-muted-foreground break-words",
          variant === "admin" && "text-zinc-400"
        )}
      >
        {msg}
      </p>
      {error.digest ? (
        <p
          className={cn(
            "mt-2 font-mono text-[11px] text-muted-foreground/80",
            variant === "admin" && "text-zinc-500"
          )}
        >
          Ref: {error.digest}
        </p>
      ) : null}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Button type="button" variant="default" onClick={() => reset()}>
          Try again
        </Button>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={buttonVariants({
              variant: "outline",
              className:
                variant === "admin"
                  ? "border-zinc-600 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
                  : undefined,
            })}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
