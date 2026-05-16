"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { VehicleHierarchyNode } from "@/lib/catalog/vehicle-hierarchy";

import { adminInputClass } from "@/components/admin/admin-form-ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  value: string[];
  onChange: (slugs: string[]) => void;
  disabled?: boolean;
};

export function AdminVehicleCompatPicker({ value, onChange, disabled }: Props) {
  const [tree, setTree] = useState<VehicleHierarchyNode[]>([]);
  const [unassigned, setUnassigned] = useState<Array<{ slug: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const selected = useMemo(() => new Set(value), [value]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/vehicles/tree", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setTree(data.tree as VehicleHierarchyNode[]);
      setUnassigned(
        (data.unassigned as Array<{ slug: string; name: string }>) ?? []
      );
    } catch {
      setTree([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const q = filter.trim().toLowerCase();

  function toggle(slug: string) {
    const next = new Set(selected);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    onChange(Array.from(next).sort());
  }

  function matches(name: string, slug: string) {
    if (!q) return true;
    return name.toLowerCase().includes(q) || slug.toLowerCase().includes(q);
  }

  if (loading) {
    return <Skeleton className="h-40 w-full rounded-xl bg-zinc-800" />;
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-[11px] uppercase text-zinc-500">Search platforms</Label>
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={adminInputClass}
          placeholder="Filter by name or slug…"
          disabled={disabled}
        />
      </div>
      <div className="max-h-64 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 text-sm">
        {tree.map((node) => {
          const makeVehicles = node.models.flatMap((m) => m.vehicles);
          const visible = makeVehicles.some((v) => matches(v.name, v.slug));
          if (!visible && q) return null;
          return (
            <div key={node.make.id} className="mb-4 last:mb-0">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                {node.make.name}
              </p>
              {node.models.map((m) => {
                const modelVisible = m.vehicles.some((v) => matches(v.name, v.slug));
                if (!modelVisible && q) return null;
                return (
                  <div key={m.model.id} className="mb-2 ml-2">
                    <p className="mb-1 text-xs text-zinc-400">{m.model.name}</p>
                    <ul className="ml-2 space-y-1">
                      {m.vehicles
                        .filter((v) => matches(v.name, v.slug))
                        .map((v) => (
                          <li key={v.slug}>
                            <label className="flex cursor-pointer items-center gap-2 text-zinc-200">
                              <input
                                type="checkbox"
                                disabled={disabled}
                                checked={selected.has(v.slug)}
                                onChange={() => toggle(v.slug)}
                                className="size-3.5 rounded border-zinc-600"
                              />
                              <span className="truncate">{v.name}</span>
                              <span className="font-mono text-[10px] text-zinc-500">{v.slug}</span>
                            </label>
                          </li>
                        ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          );
        })}
        {unassigned.length > 0 ? (
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase text-amber-500/80">
              Unassigned
            </p>
            <ul className="ml-2 space-y-1">
              {unassigned
                .filter((v) => matches(v.name, v.slug))
                .map((v) => (
                  <li key={v.slug}>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={selected.has(v.slug)}
                        onChange={() => toggle(v.slug)}
                        className="size-3.5 rounded border-zinc-600"
                      />
                      <span>{v.name}</span>
                      <span className="font-mono text-[10px] text-zinc-500">{v.slug}</span>
                    </label>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}
      </div>
      <p className="text-xs text-zinc-500">{value.length} platform(s) selected</p>
    </div>
  );
}
