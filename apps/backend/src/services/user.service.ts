import { z } from "zod";

import { hashPassword, verifyPassword } from "../lib/password.js";
import { prisma } from "../lib/prisma.js";
import { isKnownVehicleCatalogSlug } from "../lib/vehicle-slugs.js";
import {
  accountChangePasswordSchema,
  accountProfileUpdateSchema,
} from "../validators/storefront.validators.js";

const wishlistPutSchema = z.object({
  slugs: z.array(z.string().min(1).max(320)).max(120),
});

const savedVehiclesPutSchema = z.object({
  slugs: z.array(z.string().min(1).max(120)).max(48),
});

const preferencesPatchSchema = z.object({
  preferredVehicleSlug: z.union([z.string().min(1).max(120), z.null()]),
});

export const userService = {
  async updateProfile(userId: string, body: unknown) {
    const parsed = accountProfileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return { status: 400 as const, validation: parsed.error };
    }

    const { name, email, phone, preferredVehicleSlug } = parsed.data;
    if (
      preferredVehicleSlug !== null &&
      !(await isKnownVehicleCatalogSlug(preferredVehicleSlug))
    ) {
      return {
        status: 400 as const,
        body: { error: "Unknown vehicle platform" },
      };
    }

    const emailLower = email.toLowerCase();
    const conflict = await prisma.user.findFirst({
      where: { email: emailLower, NOT: { id: userId } },
      select: { id: true },
    });
    if (conflict) {
      return {
        status: 409 as const,
        body: { error: "That email is already used on another account." },
      };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email: emailLower,
        phone: phone === "" ? null : phone,
        preferredVehicleSlug,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        preferredVehicleSlug: true,
      },
    });

    return {
      status: 200 as const,
      body: {
        ok: true,
        user: {
          id: updated.id,
          email: updated.email,
          name: updated.name,
          role: updated.role,
          phone: updated.phone ?? null,
          preferredVehicleSlug: updated.preferredVehicleSlug ?? null,
        },
      },
    };
  },

  async changePassword(userId: string, body: unknown) {
    const parsed = accountChangePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return { status: 400 as const, validation: parsed.error };
    }

    const { currentPassword, newPassword } = parsed.data;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user) {
      return { status: 404 as const, body: { error: "Account not found" } };
    }

    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) {
      return {
        status: 400 as const,
        body: { error: "Current password is incorrect." },
      };
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { status: 200 as const, body: { ok: true } };
  },

  async getWishlist(userId: string) {
    const rows = await prisma.userWishlistProduct.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { productSlug: true },
    });
    return { slugs: rows.map((r) => r.productSlug) };
  },

  async toggleWishlist(userId: string, productSlug: string) {
    const row = await prisma.product.findUnique({
      where: { slug: productSlug },
      select: { id: true },
    });
    if (!row) {
      return { status: 400 as const, body: { error: "Unknown product slug" } };
    }

    const existing = await prisma.userWishlistProduct.findUnique({
      where: { userId_productSlug: { userId, productSlug } },
    });

    if (existing) {
      await prisma.userWishlistProduct.delete({ where: { id: existing.id } });
    } else {
      await prisma.userWishlistProduct.create({ data: { userId, productSlug } });
    }

    return { status: 200 as const, body: await this.getWishlist(userId) };
  },

  async replaceWishlist(userId: string, body: unknown) {
    const parsed = wishlistPutSchema.safeParse(body);
    if (!parsed.success) {
      return { status: 400 as const, body: { error: "Invalid body" } };
    }

    const unique = Array.from(new Set(parsed.data.slugs));
    const rows =
      unique.length > 0
        ? await prisma.product.findMany({
            where: { slug: { in: unique } },
            select: { slug: true },
          })
        : [];
    const known = new Set(rows.map((r) => r.slug));
    const unknownSlugs = unique.filter((s) => !known.has(s));
    if (unknownSlugs.length > 0) {
      return {
        status: 400 as const,
        body: {
          error: "Unknown product slug in list",
          unknownSlugs: unknownSlugs.slice(0, 10),
        },
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.userWishlistProduct.deleteMany({ where: { userId } });
      if (unique.length > 0) {
        await tx.userWishlistProduct.createMany({
          data: unique.map((productSlug) => ({ userId, productSlug })),
        });
      }
    });

    return { status: 200 as const, body: await this.getWishlist(userId) };
  },

  async getSavedVehicles(userId: string) {
    const rows = await prisma.userSavedVehicle.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { vehicleSlug: true },
    });
    return { slugs: rows.map((r) => r.vehicleSlug) };
  },

  async toggleSavedVehicle(userId: string, vehicleSlug: string) {
    if (!(await isKnownVehicleCatalogSlug(vehicleSlug))) {
      return { status: 400 as const, body: { error: "Unknown vehicle slug" } };
    }

    const existing = await prisma.userSavedVehicle.findUnique({
      where: { userId_vehicleSlug: { userId, vehicleSlug } },
    });

    if (existing) {
      await prisma.userSavedVehicle.delete({ where: { id: existing.id } });
    } else {
      await prisma.userSavedVehicle.create({ data: { userId, vehicleSlug } });
    }

    return { status: 200 as const, body: await this.getSavedVehicles(userId) };
  },

  async replaceSavedVehicles(userId: string, body: unknown) {
    const parsed = savedVehiclesPutSchema.safeParse(body);
    if (!parsed.success) {
      return { status: 400 as const, body: { error: "Invalid body" } };
    }

    const unique = Array.from(new Set(parsed.data.slugs));
    for (const s of unique) {
      if (!(await isKnownVehicleCatalogSlug(s))) {
        return {
          status: 400 as const,
          body: { error: "Unknown vehicle slug in list" },
        };
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.userSavedVehicle.deleteMany({ where: { userId } });
      if (unique.length > 0) {
        await tx.userSavedVehicle.createMany({
          data: unique.map((vehicleSlug) => ({ userId, vehicleSlug })),
        });
      }
    });

    return { status: 200 as const, body: await this.getSavedVehicles(userId) };
  },

  async patchPreferences(userId: string, body: unknown) {
    const parsed = preferencesPatchSchema.safeParse(body);
    if (!parsed.success) {
      return { status: 400 as const, body: { error: "Invalid body" } };
    }

    const next = parsed.data.preferredVehicleSlug;
    if (next !== null && !(await isKnownVehicleCatalogSlug(next))) {
      return { status: 400 as const, body: { error: "Unknown vehicle slug" } };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { preferredVehicleSlug: next },
    });

    return { status: 200 as const, body: { ok: true, preferredVehicleSlug: next } };
  },
};
