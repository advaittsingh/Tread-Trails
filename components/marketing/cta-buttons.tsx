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
    <Link href={href} className={cn(buttonVariants(), className)}>
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
        "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        variant === "solid" &&
          "bg-[#25D366] text-[#05301c] hover:bg-[#1ebe57]",
        variant === "outline" &&
          "border border-[#25D366]/45 bg-background text-[#0f5132] hover:bg-[#25D366]/8",
        className
      )}
    >
      <WhatsAppIcon className="size-4" />
      {label}
    </a>
  );
}
