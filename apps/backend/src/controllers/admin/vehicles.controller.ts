import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";
import { z } from "zod";

import { logAdminAction } from "../../lib/admin/admin-audit.js";
import { revalidateVehicleCatalog } from "../../lib/admin/catalog-revalidate.js";
import {
  buildVehicleWhere,
  getVehicleHierarchyTree,
  listUnassignedVehicles,
} from "../../lib/catalog/vehicle-hierarchy-admin.js";
import { mapVehicleRowToCar, vehicleListSelect } from "../../lib/catalog/map-vehicle.js";
import { prisma } from "../../lib/prisma.js";
import { backfillVehicleHierarchyFromSlugs } from "../../services/admin/backfill-vehicle-hierarchy.js";
import { adminVehicleCreateSchema } from "../../lib/validators/admin-vehicle.js";
import { adminVehiclePatchSchema } from "../../lib/validators/admin-vehicle.js";
import {
  vehicleMakeCreateSchema,
  vehicleMakePatchSchema,
  vehicleModelCreateSchema,
  vehicleModelPatchSchema,
} from "../../lib/validators/admin-vehicle-hierarchy.js";
import type { AuthedRequest } from "../../middleware/auth.js";
import { adminId, mapUniqueSlugResponse, pagination, validationError } from "./utils.js";

const compatPatchSchema = z.object({
  productIds: z.array(z.string().cuid()),
});

const treeReorderSchema = z.object({
  level: z.enum(["make", "model", "vehicle"]),
  parentId: z.string().cuid().nullable().optional(),
  orderedIds: z.array(z.string().cuid()).min(1),
});

const bulkCompatSchema = z.object({
  vehicleIds: z.array(z.string().cuid()).min(1),
  productIds: z.array(z.string().cuid()).min(1),
});

export async function listVehicles(req: Request, res: Response) {
  const { page, limit, skip } = pagination(req);
  const search = String(req.query.search ?? "").trim();
  const category = String(req.query.category ?? "").trim();
  const makeId = String(req.query.makeId ?? "").trim();
  const modelId = String(req.query.modelId ?? "").trim();

  const where = buildVehicleWhere({
    search: search || undefined,
    category: category || undefined,
    makeId: makeId || undefined,
    modelId: modelId || undefined,
  });

  try {
    const [rows, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        orderBy: [
          { sortOrder: "asc" },
          { model: { make: { name: "asc" } } },
          { model: { name: "asc" } },
          { name: "asc" },
        ],
        skip,
        take: limit,
        select: vehicleListSelect,
      }),
      prisma.vehicle.count({ where }),
    ]);

    return res.json({
      vehicles: rows.map((v) => ({
        id: v.id,
        vehicle: mapVehicleRowToCar(v),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load vehicles" });
  }
}

export async function createVehicle(req: AuthedRequest, res: Response) {
  const parsed = adminVehicleCreateSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const body = parsed.data;

  try {
    const created = await prisma.vehicle.create({
      data: {
        slug: body.slug,
        name: body.name,
        tagline: body.tagline,
        description: body.description,
        heroImage: body.heroImage,
        thumbnail: body.thumbnail,
        category: body.category,
        engineSummary: body.engineSummary,
        modelYearsLabel: body.modelYearsLabel,
        trimSummary: body.trimSummary,
        legacyId: body.legacyId ?? null,
        modelId: body.modelId ?? null,
        generationKey: body.generationKey ?? null,
        sortOrder: body.sortOrder ?? 0,
      },
    });

    revalidateVehicleCatalog();
    await logAdminAction({
      adminId: adminId(req),
      action: "vehicle.create",
      entity: "vehicle",
      entityId: created.id,
      meta: { slug: created.slug },
    });

    return res.json({
      id: created.id,
      vehicle: mapVehicleRowToCar(created),
    });
  } catch (e) {
    if (
      e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return res.status(409).json({ error: "Slug already exists" });
    }
    console.error(e);
    return res.status(500).json({ error: "Create failed" });
  }
}

export async function getVehicle(req: Request, res: Response) {
  const row = await prisma.vehicle.findUnique({
    where: { id: req.params.id as string },
    select: { ...vehicleListSelect, modelId: true },
  });
  if (!row) {
    return res.status(404).json({ error: "Not found" });
  }
  return res.json({
    id: row.id,
    vehicle: mapVehicleRowToCar(row),
    modelId: row.modelId,
  });
}

export async function patchVehicle(req: AuthedRequest, res: Response) {
  const id = req.params.id as string;
  const parsed = adminVehiclePatchSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const row = await prisma.vehicle.update({
      where: { id },
      data: parsed.data,
      include: {
        model: {
          select: {
            slug: true,
            name: true,
            make: { select: { slug: true, name: true } },
          },
        },
      },
    });
    revalidateVehicleCatalog();
    await logAdminAction({
      adminId: adminId(req),
      action: "vehicle.update",
      entity: "vehicle",
      entityId: id,
    });
    return res.json({ id: row.id, vehicle: mapVehicleRowToCar(row) });
  } catch (e) {
    if (
      e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return res.status(404).json({ error: "Not found" });
    }
    console.error(e);
    return res.status(500).json({ error: "Update failed" });
  }
}

export async function deleteVehicle(req: AuthedRequest, res: Response) {
  const id = req.params.id as string;
  try {
    await prisma.vehicle.delete({ where: { id } });
    revalidateVehicleCatalog();
    await logAdminAction({
      adminId: adminId(req),
      action: "vehicle.delete",
      entity: "vehicle",
      entityId: id,
    });
    return res.json({ ok: true });
  } catch (e) {
    if (
      e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return res.status(404).json({ error: "Not found" });
    }
    console.error(e);
    return res.status(500).json({ error: "Delete failed" });
  }
}

export async function getVehicleTree(_req: Request, res: Response) {
  try {
    const [tree, unassigned] = await Promise.all([
      getVehicleHierarchyTree(),
      listUnassignedVehicles(),
    ]);
    return res.json({ tree, unassigned });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load tree" });
  }
}

export async function backfillVehicleHierarchy(req: AuthedRequest, res: Response) {
  try {
    const result = await backfillVehicleHierarchyFromSlugs();
    await logAdminAction({
      adminId: adminId(req),
      action: "vehicle.hierarchy.backfill",
      entity: "vehicle",
      entityId: "hierarchy",
      meta: result,
    });
    revalidateVehicleCatalog();
    return res.json({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Backfill failed" });
  }
}

export async function getVehicleCompatibility(req: Request, res: Response) {
  const id = req.params.id as string;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    select: { id: true, slug: true, name: true },
  });
  if (!vehicle) {
    return res.status(404).json({ error: "Not found" });
  }

  const links = await prisma.productVehicleCompatibility.findMany({
    where: { vehicleId: vehicle.id },
    include: {
      product: {
        select: { id: true, slug: true, name: true, category: true },
      },
    },
    orderBy: { product: { name: "asc" } },
  });

  return res.json({
    vehicle,
    products: links.map((l) => l.product),
  });
}

export async function patchVehicleCompatibility(req: AuthedRequest, res: Response) {
  const id = req.params.id as string;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    select: { id: true, slug: true },
  });
  if (!vehicle) {
    return res.status(404).json({ error: "Not found" });
  }

  const parsed = compatPatchSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const productIds = Array.from(new Set(parsed.data.productIds));

  try {
    await prisma.$transaction(async (tx) => {
      await tx.productVehicleCompatibility.deleteMany({
        where: { vehicleId: vehicle.id },
      });
      if (productIds.length > 0) {
        await tx.productVehicleCompatibility.createMany({
          data: productIds.map((productId) => ({
            productId,
            vehicleId: vehicle.id,
          })),
          skipDuplicates: true,
        });
      }
    });

    await logAdminAction({
      adminId: adminId(req),
      action: "vehicle.compatibility.update",
      entity: "vehicle",
      entityId: vehicle.id,
      meta: { slug: vehicle.slug, productCount: productIds.length },
    });
    revalidateVehicleCatalog();

    return res.json({ ok: true, productCount: productIds.length });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Update failed" });
  }
}

export async function reorderVehicleTree(req: AuthedRequest, res: Response) {
  const parsed = treeReorderSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const { level, orderedIds, parentId } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i]!;

        if (level === "make") {
          await tx.vehicleMake.update({
            where: { id },
            data: { sortOrder: i },
          });
          continue;
        }

        if (level === "model") {
          if (!parentId) {
            throw new Error("parentId required for model reorder");
          }
          const model = await tx.vehicleModel.findUnique({ where: { id } });
          if (!model || model.makeId !== parentId) {
            throw new Error("invalid model parent");
          }
          await tx.vehicleModel.update({
            where: { id },
            data: { sortOrder: i },
          });
          continue;
        }

        const vehicle = await tx.vehicle.findUnique({ where: { id } });
        if (!parentId) {
          if (vehicle?.modelId != null) {
            throw new Error("invalid unassigned vehicle");
          }
        } else if (vehicle?.modelId !== parentId) {
          throw new Error("invalid vehicle parent");
        }
        await tx.vehicle.update({
          where: { id },
          data: { sortOrder: i },
        });
      }
    });

    await logAdminAction({
      adminId: adminId(req),
      action: "vehicle.tree.reorder",
      entity: "vehicle",
      entityId: "tree",
      meta: { level, count: orderedIds.length },
    });
    revalidateVehicleCatalog();

    return res.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message.includes("invalid")) {
      return res.status(400).json({ error: "Invalid reorder payload" });
    }
    if (e instanceof Error && e.message.includes("parentId")) {
      return res.status(400).json({ error: "parentId is required for this level" });
    }
    console.error(e);
    return res.status(500).json({ error: "Reorder failed" });
  }
}

export async function bulkAssignCompatibility(req: AuthedRequest, res: Response) {
  const parsed = bulkCompatSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const vehicleIds = Array.from(new Set(parsed.data.vehicleIds));
  const productIds = Array.from(new Set(parsed.data.productIds));

  try {
    const pairs = vehicleIds.flatMap((vehicleId) =>
      productIds.map((productId) => ({ vehicleId, productId }))
    );

    const result = await prisma.productVehicleCompatibility.createMany({
      data: pairs,
      skipDuplicates: true,
    });

    await logAdminAction({
      adminId: adminId(req),
      action: "vehicle.compatibility.bulk_assign",
      entity: "vehicle",
      entityId: "bulk",
      meta: {
        vehicleCount: vehicleIds.length,
        productCount: productIds.length,
        created: result.count,
      },
    });
    revalidateVehicleCatalog();

    return res.json({
      ok: true,
      created: result.count,
      vehicleCount: vehicleIds.length,
      productCount: productIds.length,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Bulk assign failed" });
  }
}

export async function bulkRemoveCompatibility(req: AuthedRequest, res: Response) {
  const parsed = bulkCompatSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const vehicleIds = Array.from(new Set(parsed.data.vehicleIds));
  const productIds = Array.from(new Set(parsed.data.productIds));

  try {
    const result = await prisma.productVehicleCompatibility.deleteMany({
      where: {
        vehicleId: { in: vehicleIds },
        productId: { in: productIds },
      },
    });

    await logAdminAction({
      adminId: adminId(req),
      action: "vehicle.compatibility.bulk_remove",
      entity: "vehicle",
      entityId: "bulk",
      meta: {
        vehicleCount: vehicleIds.length,
        productCount: productIds.length,
        removed: result.count,
      },
    });
    revalidateVehicleCatalog();

    return res.json({
      ok: true,
      removed: result.count,
      vehicleCount: vehicleIds.length,
      productCount: productIds.length,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Bulk remove failed" });
  }
}

export async function listVehicleMakes(req: Request, res: Response) {
  const search = String(req.query.search ?? "").trim();

  const where: Prisma.VehicleMakeWhereInput = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const makes = await prisma.vehicleMake.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { models: true } } },
    });
    return res.json({ makes });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load makes" });
  }
}

export async function createVehicleMake(req: AuthedRequest, res: Response) {
  const parsed = vehicleMakeCreateSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const created = await prisma.vehicleMake.create({ data: parsed.data });
    await logAdminAction({
      adminId: adminId(req),
      action: "vehicle_make.create",
      entity: "vehicle_make",
      entityId: created.id,
      meta: { slug: created.slug },
    });
    revalidateVehicleCatalog();
    return res.json({ make: created });
  } catch (e) {
    if (
      e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return res.status(409).json({ error: "Slug already exists" });
    }
    console.error(e);
    return res.status(500).json({ error: "Create failed" });
  }
}

export async function patchVehicleMake(req: AuthedRequest, res: Response) {
  const parsed = vehicleMakePatchSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const row = await prisma.vehicleMake.update({
      where: { id: req.params.id as string },
      data: parsed.data,
    });
    await logAdminAction({
      adminId: adminId(req),
      action: "vehicle_make.update",
      entity: "vehicle_make",
      entityId: row.id,
    });
    revalidateVehicleCatalog();
    return res.json({ make: row });
  } catch (e) {
    if (
      e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return res.status(404).json({ error: "Not found" });
    }
    console.error(e);
    return res.status(500).json({ error: "Update failed" });
  }
}

export async function deleteVehicleMake(req: AuthedRequest, res: Response) {
  const id = req.params.id as string;
  try {
    await prisma.vehicleMake.delete({ where: { id } });
    await logAdminAction({
      adminId: adminId(req),
      action: "vehicle_make.delete",
      entity: "vehicle_make",
      entityId: id,
    });
    revalidateVehicleCatalog();
    return res.json({ ok: true });
  } catch (e) {
    if (
      e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return res.status(404).json({ error: "Not found" });
    }
    console.error(e);
    return res.status(500).json({ error: "Delete failed" });
  }
}

export async function listVehicleModels(req: Request, res: Response) {
  const makeId = String(req.query.makeId ?? "").trim();
  const search = String(req.query.search ?? "").trim();

  const where: Prisma.VehicleModelWhereInput = {};
  if (makeId) where.makeId = makeId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const models = await prisma.vehicleModel.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        make: { select: { id: true, slug: true, name: true } },
        _count: { select: { vehicles: true } },
      },
    });
    return res.json({ models });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load models" });
  }
}

export async function createVehicleModel(req: AuthedRequest, res: Response) {
  const parsed = vehicleModelCreateSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const created = await prisma.vehicleModel.create({ data: parsed.data });
    await logAdminAction({
      adminId: adminId(req),
      action: "vehicle_model.create",
      entity: "vehicle_model",
      entityId: created.id,
      meta: { slug: created.slug, makeId: created.makeId },
    });
    revalidateVehicleCatalog();
    return res.json({ model: created });
  } catch (e) {
    if (
      e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return res
        .status(409)
        .json({ error: "Slug already exists for this make" });
    }
    console.error(e);
    return res.status(500).json({ error: "Create failed" });
  }
}

export async function patchVehicleModel(req: AuthedRequest, res: Response) {
  const parsed = vehicleModelPatchSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const row = await prisma.vehicleModel.update({
      where: { id: req.params.id as string },
      data: parsed.data,
    });
    await logAdminAction({
      adminId: adminId(req),
      action: "vehicle_model.update",
      entity: "vehicle_model",
      entityId: row.id,
    });
    revalidateVehicleCatalog();
    return res.json({ model: row });
  } catch (e) {
    if (
      e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return res.status(404).json({ error: "Not found" });
    }
    console.error(e);
    return res.status(500).json({ error: "Update failed" });
  }
}

export async function deleteVehicleModel(req: AuthedRequest, res: Response) {
  const id = req.params.id as string;
  try {
    await prisma.vehicleModel.delete({ where: { id } });
    await logAdminAction({
      adminId: adminId(req),
      action: "vehicle_model.delete",
      entity: "vehicle_model",
      entityId: id,
    });
    revalidateVehicleCatalog();
    return res.json({ ok: true });
  } catch (e) {
    if (
      e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return res.status(404).json({ error: "Not found" });
    }
    console.error(e);
    return res.status(500).json({ error: "Delete failed" });
  }
}
