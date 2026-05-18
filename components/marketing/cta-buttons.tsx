import Link from "next/link";

import { cn } from "@/lib/utils";
import { whatsappHref } from "@/lib/whatsapp";

import { buttonVariants } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";

type PrimaryCtaProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export function PrimaryCta({ href, children, className }: PrimaryCtaProps) {
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant: "default", size: "brand" }), className)}
    >
      {children}
    </Link>
  );
}

type WhatsAppCtaProps = {
  message: string;
  label?: string;
  className?: string;
  variant?: "solid" | "outline";
};

export function WhatsAppCta({
  message,
  label = "WhatsApp",
  className,
  variant = "solid",
}: WhatsAppCtaProps) {
  const href = whatsappHref(message);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-6 text-xs font-bold tracking-[0.04em] uppercase whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        variant === "solid" &&
          "bg-[#25D366] text-[#05301c] shadow-[0_4px_14px_-6px_rgba(37,211,102,0.55)] hover:bg-[#1ebe57]",
        variant === "outline" &&
          "glass-panel border border-[#25D366]/35 text-[#0f5132] hover:border-[#25D366]/55 hover:bg-[#25D366]/8",
        className
      )}
    >
      <WhatsAppIcon className="size-4" />
      {label}
    </a>
  );
}
