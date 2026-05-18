"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { toastError, toastSuccess } from "@/lib/toast";

import { adminInputClass, adminSelectClass } from "@/components/admin/admin-form-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type VehicleOption = { id: string; slug: string; name: string };
type ProductOption = { id: string; slug: string; name: string; category: string };

export function AdminVehicleCompatPanel() {
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [allProducts, setAllProducts] = useState<ProductOption[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [productSearch, setProductSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingCompat, setLoadingCompat] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadVehicles() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/vehicles?limit=500", {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed");
        const list = (data.vehicles as Array<{ id: string; vehicle: { slug: string; name: string } }>).map(
          (r) => ({ id: r.id, slug: r.vehicle.slug, name: r.vehicle.name })
        );
        setVehicles(list);
        if (list[0] && !vehicleId) setVehicleId(list[0].id);
      } catch (e) {
        toastError("Could not load vehicles", e instanceof Error ? e.message : "Error");
      } finally {
        setLoading(false);
      }
    }
    void loadVehicles();
  }, [vehicleId]);

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch("/api/admin/products?limit=500", {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed");
        setAllProducts(
          (data.products as Array<{ id: string; slug: string; name: string; category: string }>).map(
            (p) => ({
              id: p.id,
              slug: p.slug,
              name: p.name,
              category: p.category,
            })
          )
        );
      } catch {
        /* products optional until catalog exists */
      }
    }
    void loadProducts();
  }, []);

  const loadCompat = useCallback(async () => {
    if (!vehicleId) return;
    setLoadingCompat(true);
    try {
      const res = await fetch(`/api/admin/vehicles/${vehicleId}/compatibility`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setSelected(new Set((data.products as ProductOption[]).map((p) => p.id)));
    } catch (e) {
      toastError("Could not load fitment", e instanceof Error ? e.message : "Error");
      setSelected(new Set());
    } finally {
      setLoadingCompat(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    void loadCompat();
  }, [loadCompat]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return allProducts;
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [allProducts, productSearch]);

  function toggleProduct(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    if (!vehicleId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/vehicles/${vehicleId}/compatibility`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      toastSuccess("Fitment saved", `${data.productCount} products linked`);
    } catch (e) {
      toastError("Save failed", e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  const currentVehicle = vehicles.find((v) => v.id === vehicleId);

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-400">
        Link products to a platform variant. Changes write to{" "}
        <code className="text-brand-gold-dark/90">ProductVehicleCompatibility</code> and are audited.
      </p>

      <div className="flex flex-wrap gap-4">
        <div className="min-w-[280px] flex-1 space-y-1">
          <Label className="text-[11px] uppercase text-zinc-500">Platform variant</Label>
          {loading ? (
            <Skeleton className="h-10 w-full bg-zinc-800" />
          ) : (
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className={adminSelectClass}
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.slug})
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="min-w-[200px] flex-1 space-y-1">
          <Label className="text-[11px] uppercase text-zinc-500">Filter products</Label>
          <Input
            placeholder="Name, slug, category…"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className={adminInputClass}
          />
        </div>
      </div>

      {currentVehicle ? (
        <p className="font-mono text-xs text-zinc-500">
          Editing fitment for <span className="text-brand-gold-dark/90">{currentVehicle.slug}</span>
        </p>
      ) : null}

      <div className="max-h-[420px] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900/30 p-2">
        {loadingCompat ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full bg-zinc-800" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">No products match this filter.</p>
        ) : (
          <ul className="divide-y divide-zinc-800/60">
            {filteredProducts.map((p) => (
              <li key={p.id}>
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-zinc-800/40">
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleProduct(p.id)}
                    className="size-4 rounded border-zinc-600 bg-zinc-900 text-brand-maroon-light"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-zinc-100">{p.name}</span>
                    <span className="block truncate font-mono text-[11px] text-zinc-500">
                      {p.slug} · {p.category}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={() => void save()}
          disabled={saving || !vehicleId}
          className="bg-brand-maroon-light hover:bg-brand-maroon"
        >
          {saving ? "Saving…" : `Save fitment (${selected.size})`}
        </Button>
        <span className="text-xs text-zinc-500">
          Product form slug lists still sync via the same compatibility table.
        </span>
      </div>
    </div>
  );
}
