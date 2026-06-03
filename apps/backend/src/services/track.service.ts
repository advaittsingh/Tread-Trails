import { z } from "zod";

import { lookupGeo } from "../lib/geo-ip.js";
import { clientIpFromHeaders, hashIp } from "../lib/ip-hash.js";
import { prisma } from "../lib/prisma.js";
import { purgeStalePresenceSessions } from "../lib/presence/cleanup.js";
import { parseUserAgent } from "../lib/presence/parse-user-agent.js";

const pingBodySchema = z.object({
  sessionId: z.string().min(8).max(128),
  path: z.string().max(512),
});

let lastCleanupAt = 0;
const CLEANUP_THROTTLE_MS = 90_000;

async function maybePurgeStale(): Promise<void> {
  const now = Date.now();
  if (now - lastCleanupAt < CLEANUP_THROTTLE_MS) return;
  lastCleanupAt = now;
  await purgeStalePresenceSessions(now);
}

const cartLineSchema = z.object({
  productSlug: z.string().min(1),
  quantity: z.number().int().min(0),
  name: z.string().optional(),
  variantId: z.string().optional(),
  unitPrice: z.number().min(0).nullable().optional(),
  image: z.string().max(2048).optional(),
});

const cartBodySchema = z.object({
  sessionId: z.string().min(8).max(128),
  lines: z.array(cartLineSchema),
  itemCount: z.number().int().min(0),
  subtotalHint: z.number().min(0).optional(),
  userEmail: z.string().email().optional(),
  customerName: z.string().max(120).optional(),
  lastPath: z.string().max(512).optional(),
});

const pageBodySchema = z.object({
  sessionId: z.string().min(8).max(128),
  path: z.string().max(512),
});

export const trackService = {
  async recordCart(body: unknown) {
    const parsed = cartBodySchema.safeParse(body);
    if (!parsed.success) {
      return { status: 400 as const, body: { error: "Invalid payload" } };
    }

    const {
      sessionId,
      lines,
      itemCount,
      subtotalHint,
      userEmail,
      customerName,
      lastPath,
    } = parsed.data;

    const email = userEmail?.trim() ? userEmail.trim().toLowerCase() : null;
    const name = customerName?.trim() || null;

    try {
      await prisma.cartTelemetry.upsert({
        where: { sessionId },
        create: {
          sessionId,
          lines,
          itemCount,
          subtotalHint: subtotalHint ?? 0,
          userEmail: email,
          customerName: name,
          lastPath: lastPath ?? "",
        },
        update: {
          lines,
          itemCount,
          subtotalHint: subtotalHint ?? 0,
          ...(email ? { userEmail: email } : {}),
          ...(name ? { customerName: name } : {}),
          lastPath: lastPath ?? "",
          updatedAt: new Date(),
        },
      });

      return { status: 200 as const, body: { ok: true } };
    } catch (e) {
      console.error(e);
      return { status: 500 as const, body: { error: "Cart telemetry failed" } };
    }
  },

  async recordPage(body: unknown) {
    const parsed = pageBodySchema.safeParse(body);
    if (!parsed.success) {
      return { status: 400 as const, body: { error: "Invalid payload" } };
    }

    try {
      await prisma.pageHit.create({
        data: {
          sessionId: parsed.data.sessionId,
          path: parsed.data.path,
        },
      });
      return { status: 200 as const, body: { ok: true } };
    } catch (e) {
      console.error(e);
      return { status: 500 as const, body: { error: "Failed to record view" } };
    }
  },

  async ping(
    body: unknown,
    headers: Record<string, string | string[] | undefined>
  ) {
    const parsed = pingBodySchema.safeParse(body);
    if (!parsed.success) {
      return { status: 400 as const, body: { error: "Invalid payload" } };
    }

    const { sessionId, path } = parsed.data;
    const ip = clientIpFromHeaders(headers);
    const ipHash = ip ? hashIp(ip) : "";
    const ua =
      (typeof headers["user-agent"] === "string" ? headers["user-agent"] : "") ??
      "";
    const { deviceType, deviceLabel } = parseUserAgent(ua);
    const now = new Date();

    try {
      const doc = await prisma.presenceSession.upsert({
        where: { sessionId },
        create: {
          sessionId,
          path,
          userAgent: ua.slice(0, 512),
          deviceType,
          deviceLabel,
          ipHash,
          geoResolved: false,
          firstSeenAt: now,
          lastSeenAt: now,
        },
        update: {
          path,
          userAgent: ua.slice(0, 512),
          deviceType,
          deviceLabel,
          ipHash,
          lastSeenAt: now,
        },
        select: {
          sessionId: true,
          geoResolved: true,
        },
      });

      const needsGeo = doc && !doc.geoResolved && ip;

      if (needsGeo) {
        const geo = await lookupGeo(ip);
        if (geo.city || geo.lat != null) {
          await prisma.presenceSession.update({
            where: { sessionId },
            data: {
              city: geo.city ?? null,
              country: geo.country ?? null,
              lat: geo.lat ?? null,
              lng: geo.lng ?? null,
              geoResolved: true,
            },
          });
        }
      }

      void maybePurgeStale();

      return { status: 200 as const, body: { ok: true } };
    } catch (e) {
      console.error("[presence] ping failed", e);
      return { status: 500 as const, body: { error: "Ping failed" } };
    }
  },
};
