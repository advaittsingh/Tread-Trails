import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { invalidateUserSessions } from "../../lib/auth-session.js";
import { logAdminAction } from "../../lib/admin/admin-audit.js";
import { prisma } from "../../lib/prisma.js";
import { authService, AuthHttpError } from "../../services/auth.service.js";
import type { AuthedRequest } from "../../middleware/auth.js";
import { adminId, pagination, validationError } from "./utils.js";

const patchSchema = z.object({
  role: z.enum(["user", "admin"]),
});

export async function listUsers(req: Request, res: Response) {
  const { page, limit, skip } = pagination(req);
  const search = String(req.query.search ?? "").trim();
  const status = String(req.query.status ?? "").trim();

  const where: Prisma.UserWhereInput = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
      { id: { equals: search } },
    ];
  }
  if (status === "active" || status === "suspended") {
    where.status = status;
  }

  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load users" });
  }
}

export async function getUser(req: Request, res: Response) {
  const id = req.params.id as string;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        preferredVehicleSlug: true,
        sessionInvalidatedAt: true,
        createdAt: true,
        updatedAt: true,
        wishlistProducts: {
          orderBy: { createdAt: "desc" },
          select: { productSlug: true, createdAt: true },
        },
        savedVehicles: {
          orderBy: { createdAt: "desc" },
          select: { vehicleSlug: true, createdAt: true },
        },
        orders: {
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            total: true,
            status: true,
            paymentMethod: true,
            createdAt: true,
          },
        },
        bookings: {
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            vehicleName: true,
            service: true,
            status: true,
            date: true,
            time: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            orders: true,
            bookings: true,
            wishlistProducts: true,
            savedVehicles: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Not found" });
    }

    const wishlistSlugs = user.wishlistProducts.map((w) => w.productSlug);
    const savedVehicleSlugs = user.savedVehicles.map((s) => s.vehicleSlug);

    const [products, vehicles] = await Promise.all([
      wishlistSlugs.length
        ? prisma.product.findMany({
            where: { slug: { in: wishlistSlugs } },
            select: { slug: true, name: true },
          })
        : Promise.resolve([]),
      savedVehicleSlugs.length
        ? prisma.vehicle.findMany({
            where: { slug: { in: savedVehicleSlugs } },
            select: { slug: true, name: true },
          })
        : Promise.resolve([]),
    ]);

    const productNames = new Map(products.map((p) => [p.slug, p.name]));
    const vehicleNames = new Map(vehicles.map((v) => [v.slug, v.name]));

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        status: user.status,
        preferredVehicleSlug: user.preferredVehicleSlug,
        sessionInvalidatedAt: user.sessionInvalidatedAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        counts: user._count,
        orders: user.orders.map((o) => ({
          ...o,
          createdAt: o.createdAt.toISOString(),
        })),
        bookings: user.bookings.map((b) => ({
          ...b,
          createdAt: b.createdAt.toISOString(),
        })),
        wishlist: user.wishlistProducts.map((w) => ({
          productSlug: w.productSlug,
          name: productNames.get(w.productSlug) ?? w.productSlug,
          createdAt: w.createdAt.toISOString(),
        })),
        savedVehicles: user.savedVehicles.map((s) => ({
          vehicleSlug: s.vehicleSlug,
          name: vehicleNames.get(s.vehicleSlug) ?? s.vehicleSlug,
          createdAt: s.createdAt.toISOString(),
        })),
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load user" });
  }
}

export async function patchUser(req: AuthedRequest, res: Response) {
  const targetId = req.params.id as string;
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  if (targetId === adminId(req) && parsed.data.role !== "admin") {
    return res.status(400).json({
      error: "You cannot remove your own admin role",
    });
  }

  try {
    const prev = await prisma.user.findUnique({ where: { id: targetId } });
    if (!prev) {
      return res.status(404).json({ error: "Not found" });
    }

    const user = await prisma.user.update({
      where: { id: targetId },
      data: { role: parsed.data.role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    if (parsed.data.role !== prev.role) {
      await invalidateUserSessions(targetId);
    }

    await logAdminAction({
      adminId: adminId(req),
      action: "user.role_update",
      entity: "user",
      entityId: targetId,
      previousValue: { role: prev.role },
      newValue: { role: parsed.data.role },
      meta: { from: prev.role, to: parsed.data.role },
    });

    return res.json({ user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Update failed" });
  }
}

export async function suspendUser(req: AuthedRequest, res: Response) {
  const targetId = req.params.id as string;

  if (targetId === adminId(req)) {
    return res.status(400).json({ error: "You cannot suspend your own account" });
  }

  try {
    const prev = await prisma.user.findUnique({ where: { id: targetId } });
    if (!prev) {
      return res.status(404).json({ error: "Not found" });
    }

    if (prev.status === "suspended") {
      return res.json({
        user: {
          id: prev.id,
          email: prev.email,
          status: prev.status,
        },
      });
    }

    const now = new Date();
    const user = await prisma.user.update({
      where: { id: targetId },
      data: { status: "suspended", sessionInvalidatedAt: now },
      select: { id: true, email: true, status: true },
    });

    await logAdminAction({
      adminId: adminId(req),
      action: "user.suspend",
      entity: "user",
      entityId: targetId,
      previousValue: { status: prev.status },
      newValue: { status: "suspended" },
    });

    return res.json({ user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Suspend failed" });
  }
}

export async function activateUser(req: AuthedRequest, res: Response) {
  const targetId = req.params.id as string;

  try {
    const prev = await prisma.user.findUnique({ where: { id: targetId } });
    if (!prev) {
      return res.status(404).json({ error: "Not found" });
    }

    const user = await prisma.user.update({
      where: { id: targetId },
      data: { status: "active" },
      select: { id: true, email: true, status: true },
    });

    await logAdminAction({
      adminId: adminId(req),
      action: "user.activate",
      entity: "user",
      entityId: targetId,
      previousValue: { status: prev.status },
      newValue: { status: "active" },
    });

    return res.json({ user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Activate failed" });
  }
}

export async function resetUserPassword(req: AuthedRequest, res: Response) {
  const targetId = req.params.id as string;

  try {
    const result = await authService.adminSendPasswordReset(targetId);
    await invalidateUserSessions(targetId);

    await logAdminAction({
      adminId: adminId(req),
      action: "user.password_reset",
      entity: "user",
      entityId: targetId,
      meta: { emailed: result.emailed },
    });

    return res.json(result);
  } catch (e) {
    if (e instanceof AuthHttpError) {
      return res.status(e.status).json({ error: e.message });
    }
    console.error(e);
    return res.status(500).json({ error: "Password reset failed" });
  }
}

export async function forceLogoutUser(req: AuthedRequest, res: Response) {
  const targetId = req.params.id as string;

  try {
    const prev = await prisma.user.findUnique({ where: { id: targetId } });
    if (!prev) {
      return res.status(404).json({ error: "Not found" });
    }

    await invalidateUserSessions(targetId);

    await logAdminAction({
      adminId: adminId(req),
      action: "user.force_logout",
      entity: "user",
      entityId: targetId,
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Force logout failed" });
  }
}
