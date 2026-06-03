const FALLBACK_PHONE = "919876543210";

export function whatsappNumber(): string {
  const raw =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ?? FALLBACK_PHONE;
  return raw.length ? raw : FALLBACK_PHONE;
}

export function whatsappHref(message: string): string {
  const text = encodeURIComponent(message.trim());
  return `https://wa.me/${whatsappNumber()}?text=${text}`;
}

export function whatsappProductInterest(
  productName: string,
  vehicleName?: string
): string {
  const v = vehicleName?.trim();
  if (v) {
    return `Hi — I'm interested in ${productName} for my ${v}.`;
  }
  return `Hi — I'm interested in ${productName}.`;
}

export function whatsappBuildInterest(buildTitle: string): string {
  return `Hi — I want a build like "${buildTitle}" for my car. Can we discuss options?`;
}
