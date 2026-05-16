import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/request-user";
import { logAdminAction } from "@/lib/server/admin-audit";
import { backfillVehicleHierarchyFromSlugs } from "@/lib/server/backfill-vehicle-hierarchy";
import { revalidateVehicleCatalog } from "@/lib/server/revalidate-vehicle-catalog";

export async function POST() {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  try {
    const result = await backfillVehicleHierarchyFromSlugs();
    await logAdminAction({
      adminId: gate.auth.userId,
      action: "vehicle.hierarchy.backfill",
      entity: "vehicle",
      entityId: "hierarchy",
      meta: result,
    });
    revalidateVehicleCatalog();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Backfill failed" }, { status: 500 });
  }
}
