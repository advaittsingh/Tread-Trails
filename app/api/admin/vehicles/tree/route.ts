import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/request-user";
import {
  getVehicleHierarchyTree,
  listUnassignedVehicles,
} from "@/lib/catalog/vehicle-hierarchy";

export async function GET() {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  try {
    const [tree, unassigned] = await Promise.all([
      getVehicleHierarchyTree(),
      listUnassignedVehicles(),
    ]);
    return NextResponse.json({ tree, unassigned });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load tree" }, { status: 500 });
  }
}
