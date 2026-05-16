import type { CartTelemetry, Prisma } from "@prisma/client";

import {
  buildCartRecoveryEmail,
  whatsappRecoveryMessage,
  type CartRecoveryLine,
  type CartRecoveryTemplateId,
} from "@/lib/email/cart-recovery-templates";
import { sendTransactionalEmail } from "@/lib/email/transactional";
import { resolveVariants, unitPriceForVariant } from "@/lib/pricing";
import { getProductBySlug } from "@/lib/server/product-catalog";
import { absoluteUrl } from "@/lib/site";
import { prisma } from "@/lib/prisma";
import { whatsappHref } from "@/lib/whatsapp";

const CART_EMAIL_COOLDOWN_MS =
  Number(process.env.CART_RECOVERY_CART_COOLDOWN_MS) || 4 * 60 * 60 * 1000;
const ADMIN_EMAIL_HOURLY_LIMIT =
  Number(process.env.CART_RECOVERY_ADMIN_HOURLY_LIMIT) || 30;

export type RawTelemetryLine = {
  productSlug?: string;
  slug?: string;
  quantity?: number;
  qty?: number;
  name?: string;
  variantId?: string;
  unitPrice?: number | null;
  image?: string;
};

export type EnrichedCartRow = {
  sessionId: string;
  itemCount: number;
  subtotalHint: number;
  userEmail: string | null;
  customerName: string | null;
  lastPath: string;
  updatedAt: Date;
  lines: CartRecoveryLine[];
  recovery: {
    sentAt: string | null;
    whatsappAt: string | null;
    template: string | null;
    recovered: boolean;
    recoveredAt: string | null;
    converted: boolean;
    convertedAt: string | null;
    convertedOrderId: string | null;
  };
  lastActivityMinutes: number;
};

function parseLines(raw: unknown): RawTelemetryLine[] {
  if (!Array.isArray(raw)) return [];
  return raw as RawTelemetryLine[];
}

export async function enrichCartLines(
  rawLines: unknown
): Promise<CartRecoveryLine[]> {
  const parsed = parseLines(rawLines);
  const out: CartRecoveryLine[] = [];

  for (const line of parsed) {
    const slug = (line.productSlug ?? line.slug ?? "").trim();
    const quantity = Math.max(1, line.quantity ?? line.qty ?? 1);
    let name = line.name?.trim() || slug || "Item";
    let image = line.image;
    let unitPrice = line.unitPrice ?? null;
    let variantLabel: string | undefined;

    if (slug) {
      const product = await getProductBySlug(slug);
      if (product) {
        name = product.name;
        if (!image && product.images[0]) image = product.images[0];
        const variants = resolveVariants(product);
        if (unitPrice == null && line.variantId) {
          const variant = variants.find((v) => v.id === line.variantId);
          if (variant) variantLabel = variant.label;
          unitPrice = unitPriceForVariant(product, line.variantId);
        } else if (unitPrice == null && variants[0]) {
          variantLabel = variants[0].label;
          unitPrice = unitPriceForVariant(product, variants[0].id);
        }
      }
    }

    out.push({
      name,
      productSlug: slug || "unknown",
      quantity,
      unitPrice,
      image: image
        ? image.startsWith("http")
          ? image
          : absoluteUrl(image)
        : undefined,
      variantLabel,
    });
  }

  return out;
}

export async function mapCartTelemetryRow(
  cart: CartTelemetry
): Promise<EnrichedCartRow> {
  const lines = await enrichCartLines(cart.lines);
  const idleMs = Date.now() - cart.updatedAt.getTime();

  return {
    sessionId: cart.sessionId,
    itemCount: cart.itemCount,
    subtotalHint: cart.subtotalHint,
    userEmail: cart.userEmail,
    customerName: cart.customerName,
    lastPath: cart.lastPath,
    updatedAt: cart.updatedAt,
    lines,
    lastActivityMinutes: Math.max(0, Math.round(idleMs / 60_000)),
    recovery: {
      sentAt: cart.recoveryEmailSentAt?.toISOString() ?? null,
      whatsappAt: cart.recoveryWhatsappAt?.toISOString() ?? null,
      template: cart.recoveryTemplate,
      recovered: Boolean(cart.recoveredAt),
      recoveredAt: cart.recoveredAt?.toISOString() ?? null,
      converted: Boolean(cart.convertedAt),
      convertedAt: cart.convertedAt?.toISOString() ?? null,
      convertedOrderId: cart.convertedOrderId,
    },
  };
}

async function countAdminEmailsLastHour(adminId: string): Promise<number> {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  return prisma.cartRecoveryLog.count({
    where: {
      adminId,
      channel: "email",
      action: "sent",
      createdAt: { gte: since },
    },
  });
}

function cartEmailCooldownActive(
  cart: CartTelemetry,
  force?: boolean
): boolean {
  if (force) return false;
  if (!cart.recoveryEmailSentAt) return false;
  return Date.now() - cart.recoveryEmailSentAt.getTime() < CART_EMAIL_COOLDOWN_MS;
}

export type RecoverCartInput = {
  sessionId: string;
  action: "email" | "whatsapp" | "mark_recovered" | "mark_converted";
  template?: CartRecoveryTemplateId;
  firstName?: string;
  force?: boolean;
  orderId?: string;
  adminId: string;
};

export type RecoverCartResult =
  | {
      ok: true;
      action: RecoverCartInput["action"];
      whatsappUrl?: string;
      emailId?: string;
      provider?: string;
    }
  | { ok: false; status: number; error: string };

export async function recoverAbandonedCart(
  input: RecoverCartInput
): Promise<RecoverCartResult> {
  const cart = await prisma.cartTelemetry.findUnique({
    where: { sessionId: input.sessionId },
  });

  if (!cart || cart.itemCount <= 0) {
    return { ok: false, status: 404, error: "Cart not found or empty." };
  }

  const template: CartRecoveryTemplateId =
    input.template ?? (cart.recoveryTemplate as CartRecoveryTemplateId) ?? "complete_order";

  const lines = await enrichCartLines(cart.lines);
  const checkoutUrl = absoluteUrl("/checkout");
  const ctx = {
    firstName: input.firstName ?? cart.customerName ?? undefined,
    lines,
    subtotalHint: cart.subtotalHint,
    checkoutUrl,
  };

  if (input.action === "mark_recovered") {
    await prisma.$transaction([
      prisma.cartTelemetry.update({
        where: { sessionId: cart.sessionId },
        data: { recoveredAt: new Date() },
      }),
      prisma.cartRecoveryLog.create({
        data: {
          sessionId: cart.sessionId,
          channel: "manual",
          action: "mark_recovered",
          adminId: input.adminId,
        },
      }),
    ]);
    return { ok: true, action: "mark_recovered" };
  }

  if (input.action === "mark_converted") {
    await prisma.$transaction([
      prisma.cartTelemetry.update({
        where: { sessionId: cart.sessionId },
        data: {
          convertedAt: new Date(),
          convertedOrderId: input.orderId ?? cart.convertedOrderId,
          recoveredAt: cart.recoveredAt ?? new Date(),
        },
      }),
      prisma.cartRecoveryLog.create({
        data: {
          sessionId: cart.sessionId,
          channel: "manual",
          action: "mark_converted",
          adminId: input.adminId,
          meta: input.orderId ? { orderId: input.orderId } : undefined,
        },
      }),
    ]);
    return { ok: true, action: "mark_converted" };
  }

  if (input.action === "whatsapp") {
    const message = whatsappRecoveryMessage(template, ctx);
    const url = whatsappHref(message);
    await prisma.$transaction([
      prisma.cartTelemetry.update({
        where: { sessionId: cart.sessionId },
        data: {
          recoveryWhatsappAt: new Date(),
          recoveryTemplate: template,
          recoveredAt: cart.recoveredAt ?? new Date(),
        },
      }),
      prisma.cartRecoveryLog.create({
        data: {
          sessionId: cart.sessionId,
          channel: "whatsapp",
          action: "link_opened",
          template,
          adminId: input.adminId,
        },
      }),
    ]);
    return { ok: true, action: "whatsapp", whatsappUrl: url };
  }

  if (input.action === "email") {
    if (!cart.userEmail) {
      return {
        ok: false,
        status: 400,
        error: "No customer email on this cart — capture email at checkout or CRM first.",
      };
    }

    if (cartEmailCooldownActive(cart, input.force)) {
      return {
        ok: false,
        status: 429,
        error: `Recovery email was sent recently. Wait ${Math.ceil(CART_EMAIL_COOLDOWN_MS / 3_600_000)}h or use force.`,
      };
    }

    const adminCount = await countAdminEmailsLastHour(input.adminId);
    if (adminCount >= ADMIN_EMAIL_HOURLY_LIMIT) {
      return {
        ok: false,
        status: 429,
        error: `Hourly recovery email limit reached (${ADMIN_EMAIL_HOURLY_LIMIT}/hr per admin).`,
      };
    }

    const { subject, html } = buildCartRecoveryEmail(template, ctx);
    const sent = await sendTransactionalEmail({
      to: cart.userEmail,
      subject,
      html,
    });

    if (!sent.ok) {
      console.error("[cart-recovery] email failed", {
        sessionId: cart.sessionId,
        error: sent.error,
      });
      return { ok: false, status: 502, error: sent.error };
    }

    await prisma.$transaction([
      prisma.cartTelemetry.update({
        where: { sessionId: cart.sessionId },
        data: {
          recoveryEmailSentAt: new Date(),
          recoveryTemplate: template,
          recoveredAt: cart.recoveredAt ?? new Date(),
        },
      }),
      prisma.cartRecoveryLog.create({
        data: {
          sessionId: cart.sessionId,
          channel: "email",
          action: "sent",
          template,
          adminId: input.adminId,
          meta: {
            provider: sent.provider,
            messageId: sent.id,
            to: cart.userEmail,
          } satisfies Prisma.InputJsonObject,
        },
      }),
    ]);

    console.info("[cart-recovery] email sent", {
      sessionId: cart.sessionId,
      to: cart.userEmail,
      template,
      provider: sent.provider,
    });

    return {
      ok: true,
      action: "email",
      emailId: sent.id,
      provider: sent.provider,
    };
  }

  return { ok: false, status: 400, error: "Unknown action." };
}

/** Mark open carts converted when a matching order is placed. */
export async function markCartsConvertedForEmail(
  customerEmail: string,
  orderId: string
): Promise<void> {
  const email = customerEmail.trim().toLowerCase();
  if (!email) return;

  try {
    const carts = await prisma.cartTelemetry.findMany({
      where: {
        userEmail: email,
        itemCount: { gt: 0 },
        convertedAt: null,
      },
    });

    if (carts.length === 0) return;

    const now = new Date();
    await prisma.$transaction([
      ...carts.map((c) =>
        prisma.cartTelemetry.update({
          where: { sessionId: c.sessionId },
          data: {
            convertedAt: now,
            convertedOrderId: orderId,
            recoveredAt: c.recoveredAt ?? now,
          },
        })
      ),
      ...carts.map((c) =>
        prisma.cartRecoveryLog.create({
          data: {
            sessionId: c.sessionId,
            channel: "system",
            action: "order_converted",
            meta: { orderId, email },
          },
        })
      ),
    ]);

    console.info("[cart-recovery] auto-converted", {
      email,
      orderId,
      count: carts.length,
    });
  } catch (e) {
    console.error("[cart-recovery] mark converted failed", e);
  }
}
