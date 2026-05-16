"use client";

import { useState } from "react";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-form-ui";
import { AdminVehicleCompatPanel } from "@/components/admin/admin-vehicle-compat-panel";
import { AdminVehicleMakesPanel } from "@/components/admin/admin-vehicle-makes-panel";
import { AdminVehicleModelsPanel } from "@/components/admin/admin-vehicle-models-panel";
import { AdminVehiclesTable } from "@/components/admin/admin-vehicles-table";
import { Button } from "@/components/ui/button";
import { toastError, toastSuccess } from "@/lib/toast";

type Tab = "brands" | "models" | "variants" | "compatibility";

const TABS: { id: Tab; label: string }[] = [
  { id: "brands", label: "Brands" },
  { id: "models", label: "Models" },
  { id: "variants", label: "Variants" },
  { id: "compatibility", label: "Compatibility" },
];

export function AdminVehiclesCms() {
  const [tab, setTab] = useState<Tab>("variants");
  const [backfilling, setBackfilling] = useState(false);

  async function runBackfill() {
    setBackfilling(true);
    try {
      const res = await fetch("/api/admin/vehicles/backfill", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Backfill failed");
      toastSuccess(
        "Hierarchy backfill complete",
        `Linked ${data.linked} platforms from slugs`
      );
    } catch (e) {
      toastError("Backfill failed", e instanceof Error ? e.message : "Error");
    } finally {
      setBackfilling(false);
    }
  }

  return (
    <div className="space-y-6 p-6 lg:p-10">
      <AdminPageHeader
        title="Vehicle CMS"
        description="OEM brand → model line → platform variant. Fitment links products via ProductVehicleCompatibility."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-zinc-600 text-zinc-200"
              disabled={backfilling}
              onClick={() => void runBackfill()}
            >
              {backfilling ? "Backfilling…" : "Backfill from slugs"}
            </Button>
            <Link
              href="/admin/vehicles/new"
              className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-500"
            >
              New variant
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "bg-emerald-600/20 text-emerald-300 ring-1 ring-emerald-500/40"
                : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "brands" ? <AdminVehicleMakesPanel /> : null}
      {tab === "models" ? <AdminVehicleModelsPanel /> : null}
      {tab === "variants" ? <AdminVehiclesTable embedded /> : null}
      {tab === "compatibility" ? <AdminVehicleCompatPanel /> : null}
    </div>
  );
}
