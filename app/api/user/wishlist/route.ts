import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth } from "@/lib/auth/request-user";
import { prisma } from "@/lib/prisma";

const putSchema = z.object({
  slugs: z.array(z.string().min(1).max(320)).max(120),
});

async function listSlugsForUser(userId: string): Promise<string[]> {
  const rows = await prisma.userWishlistProduct.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { productSlug: true },
  });
  return rows.map((r) => r.productSlug);
}

async function isKnownProductSlug(slug: string): Promise<boolean> {
  const row = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });
  return Boolean(row);
}

export async function GET() {
  const gate = await requireAuth();
  if ("response" in gate) return gate.response;

  try {
    const slugs = await listSlugsForUser(gate.auth.userId);
    return NextResponse.json({ slugs });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not load wishlist" }, { status: 500 });
  }
}

/** Toggle one product slug; returns authoritative list */
export async function POST(req: Request) {
  const gate = await requireAuth();
  if ("response" in gate) return gate.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = z.object({ productSlug: z.string().min(1).max(320) }).safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { productSlug } = parsed.data;
  if (!(await isKnownProductSlug(productSlug))) {
    return NextResponse.json({ error: "Unknown product slug" }, { status: 400 });
  }

  try {
    const existing = await prisma.userWishlistProduct.findUnique({
      where: {
        userId_productSlug: {
          userId: gate.auth.userId,
          productSlug,
        },
      },
    });

    if (existing) {
      await prisma.userWishlistProduct.delete({ where: { id: existing.id } });
    } else {
      await prisma.userWishlistProduct.create({
        data: {
          userId: gate.auth.userId,
          productSlug,
        },
      });
    }

    const slugs = await listSlugsForUser(gate.auth.userId);
    return NextResponse.json({ slugs });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not update wishlist" }, { status: 500 });
  }
}

/** Replace full wishlist (guest merge on login) */
export async function PUT(req: Request) {
  const gate = await requireAuth();
  if ("response" in gate) return gate.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = putSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
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
    return NextResponse.json(
      {
        error: "Unknown product slug in list",
        unknownSlugs: unknownSlugs.slice(0, 10),
      },
      { status: 400 }
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.userWishlistProduct.deleteMany({
        where: { userId: gate.auth.userId },
      });
      if (unique.length > 0) {
        await tx.userWishlistProduct.createMany({
          data: unique.map((productSlug) => ({
            userId: gate.auth.userId,
            productSlug,
          })),
        });
      }
    });

    const slugs = await listSlugsForUser(gate.auth.userId);
    return NextResponse.json({ slugs });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not replace wishlist" }, { status: 500 });
  }
}
