"use client";

import { usePathname } from "next/navigation";

import { useCompare } from "@/contexts/compare-context";
import { cn } from "@/lib/utils";
import { whatsappHref } from "@/lib/whatsapp";

import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";

export function WhatsAppFloat() {
  const pathname = usePathname();
  const { hydrated, count } = useCompare();
  const isAdmin = pathname?.startsWith("/admin") ?? false;
  const trayVisible =
    hydrated &&
    count > 0 &&
    !isAdmin &&
    pathname !== "/compare";

  return (
    <a
      href={whatsappHref("Hi — I'd like to speak with Tread Trails about a build.")}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "fixed right-6 z-50 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-[#05301c] shadow-card transition hover:scale-105 hover:bg-[#1ebe57] hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:right-8",
        trayVisible ? "bottom-24 md:bottom-[7.25rem]" : "bottom-6 md:bottom-8"
      )}
      aria-label="Chat on WhatsApp"
    >
      <WhatsAppIcon className="size-7" />
    </a>
  );
}
