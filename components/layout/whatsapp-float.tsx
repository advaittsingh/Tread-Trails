"use client";

import { whatsappHref } from "@/lib/whatsapp";

import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";

export function WhatsAppFloat() {
  return (
    <a
      href={whatsappHref("Hi — I'd like to speak with Tread Trails about a build.")}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-[#05301c] shadow-card transition hover:scale-105 hover:bg-[#1ebe57] hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:bottom-8 md:right-8"
      aria-label="Chat on WhatsApp"
    >
      <WhatsAppIcon className="size-7" />
    </a>
  );
}
