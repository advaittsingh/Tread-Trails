import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminQuery } from "@/api/admin";
import { apiFetchJson } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

type VehicleListItem = {
  id: string;
  vehicle: { slug: string; name: string; category: string };
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
};

type VehiclesResponse = {
  vehicles: VehicleListItem[];
  total: number;
};

type ProductListItem = {
  id: string;
  product: ProductRow;
};

type ProductsResponse = {
  products: ProductListItem[];
  total: number;
};

type CompatResponse = {
  vehicle: { id: string; slug: string; name: string };
  products: ProductRow[];
};

export default function VehicleCompatibilityPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [vehicleSearch, setVehicleSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<Set<string>>(new Set());
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  const [singleVehicleId, setSingleVehicleId] = useState("");
  const [singleProductIds, setSingleProductIds] = useState<Set<string>>(new Set());

  const vehiclesQ = useAdminQuery<VehiclesResponse>("/api/admin/vehicles", {
    limit: 200,
    search: vehicleSearch || undefined,
  });

  const productsQ = useAdminQuery<ProductsResponse>("/api/admin/products", {
    limit: 200,
    search: productSearch || undefined,
  });

  const compatQ = useAdminQuery<CompatResponse>(
    singleVehicleId ? `/api/admin/vehicles/${singleVehicleId}/compatibility` : "",
    undefined,
    { enabled: Boolean(singleVehicleId) }
  );

  useEffect(() => {
    const ids = new Set((compatQ.data?.products ?? []).map((p) => p.id));
    setSingleProductIds(ids);
  }, [compatQ.data]);

  const vehicles = vehiclesQ.data?.vehicles ?? [];
  const products = useMemo(
    () =>
      (productsQ.data?.products ?? []).map((p) => ({
        id: p.id,
        slug: p.product.slug,
        name: p.product.name,
        brand: p.product.brand,
        category: p.product.category,
      })),
    [productsQ.data]
  );

  const toggleVehicle = (id: string) => {
    setSelectedVehicleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSingleProduct = (id: string) => {
    setSingleProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkMut = useMutation({
    mutationFn: (action: "assign" | "remove") =>
      apiFetchJson(
        action === "assign"
          ? "/api/admin/vehicles/compatibility/bulk-assign"
          : "/api/admin/vehicles/compatibility/bulk-remove",
        {
          method: "POST",
          body: JSON.stringify({
            vehicleIds: Array.from(selectedVehicleIds),
            productIds: Array.from(selectedProductIds),
          }),
        }
      ),
    onSuccess: (_data, action) => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: action === "assign" ? "Products assigned" : "Products removed" });
    },
    onError: (e: Error) =>
      toast({ title: "Bulk action failed", description: e.message, variant: "destructive" }),
  });

  const saveSingleMut = useMutation({
    mutationFn: () =>
      apiFetchJson(`/api/admin/vehicles/${singleVehicleId}/compatibility`, {
        method: "PATCH",
        body: JSON.stringify({ productIds: Array.from(singleProductIds) }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: "Compatibility saved" });
    },
    onError: (e: Error) =>
      toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const bulkReady = selectedVehicleIds.size > 0 && selectedProductIds.size > 0;

  return (
    <>
      <CardContent className="px-3 lg:px-6 pb-4">
        <p className="text-sm text-stone-600">
          Map products to vehicle platforms for fitment filtering on the storefront.
        </p>
      </CardContent>

      <Tabs defaultValue="bulk">
        <CardContent className="px-3 lg:px-6 pb-4">
          <TabsList>
            <TabsTrigger value="bulk">Bulk mapping</TabsTrigger>
            <TabsTrigger value="single">Single vehicle</TabsTrigger>
          </TabsList>
        </CardContent>

        <TabsContent value="bulk">
          <div className="grid gap-6 lg:grid-cols-2 px-3 lg:px-6 pb-6">
            <section className="rounded-lg border border-stone-200 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-stone-900">Vehicles</h2>
                <Badge variant="secondary">{selectedVehicleIds.size} selected</Badge>
              </div>
              <Input
                placeholder="Search vehicles…"
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
              />
              <div className="max-h-80 overflow-y-auto space-y-2">
                {vehiclesQ.isLoading ? (
                  <p className="text-sm text-stone-500">Loading…</p>
                ) : vehicles.length === 0 ? (
                  <p className="text-sm text-stone-500">No vehicles.</p>
                ) : (
                  vehicles.map((v) => (
                    <label
                      key={v.id}
                      className="flex items-start gap-2 text-sm cursor-pointer rounded-md p-2 hover:bg-stone-50"
                    >
                      <Checkbox
                        checked={selectedVehicleIds.has(v.id)}
                        onCheckedChange={() => toggleVehicle(v.id)}
                      />
                      <span>
                        <span className="font-medium text-stone-900">{v.vehicle.name}</span>
                        <span className="block text-xs text-stone-500 font-mono">{v.vehicle.slug}</span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-lg border border-stone-200 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-stone-900">Products</h2>
                <Badge variant="secondary">{selectedProductIds.size} selected</Badge>
              </div>
              <Input
                placeholder="Search products…"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
              <div className="max-h-80 overflow-y-auto space-y-2">
                {productsQ.isLoading ? (
                  <p className="text-sm text-stone-500">Loading…</p>
                ) : products.length === 0 ? (
                  <p className="text-sm text-stone-500">No products.</p>
                ) : (
                  products.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-start gap-2 text-sm cursor-pointer rounded-md p-2 hover:bg-stone-50"
                    >
                      <Checkbox
                        checked={selectedProductIds.has(p.id)}
                        onCheckedChange={() => toggleProduct(p.id)}
                      />
                      <span>
                        <span className="font-medium text-stone-900">{p.name}</span>
                        <span className="block text-xs text-stone-500">
                          {p.brand} · {p.category}
                        </span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </section>
          </div>

          <CardContent className="px-3 lg:px-6 pb-6 flex flex-wrap gap-3">
            <Button
              disabled={!bulkReady || bulkMut.isPending}
              onClick={() => bulkMut.mutate("assign")}
            >
              Bulk assign
            </Button>
            <Button
              variant="destructive"
              disabled={!bulkReady || bulkMut.isPending}
              onClick={() => bulkMut.mutate("remove")}
            >
              Bulk remove
            </Button>
          </CardContent>
        </TabsContent>

        <TabsContent value="single">
          <CardContent className="px-3 lg:px-6 pb-4 space-y-3">
            <div className="space-y-1 max-w-md">
              <Label>Vehicle platform</Label>
              <Select value={singleVehicleId || "__none__"} onValueChange={(v) => setSingleVehicleId(v === "__none__" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select…</SelectItem>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.vehicle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>

          {singleVehicleId ? (
            <CardContent className="px-3 lg:px-6 pb-6 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-stone-900">
                  Compatible products for {compatQ.data?.vehicle.name ?? "…"}
                </h2>
                <Badge variant="secondary">{singleProductIds.size} selected</Badge>
              </div>
              <Input
                placeholder="Filter products…"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
              <div className="max-h-96 overflow-y-auto space-y-2 rounded-lg border border-stone-200 p-3">
                {products.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-start gap-2 text-sm cursor-pointer rounded-md p-2 hover:bg-stone-50"
                  >
                    <Checkbox
                      checked={singleProductIds.has(p.id)}
                      onCheckedChange={() => toggleSingleProduct(p.id)}
                    />
                    <span>
                      <span className="font-medium text-stone-900">{p.name}</span>
                      <span className="block text-xs text-stone-500">{p.slug}</span>
                    </span>
                  </label>
                ))}
              </div>
              <Button
                disabled={saveSingleMut.isPending}
                onClick={() => saveSingleMut.mutate()}
              >
                Save compatibility
              </Button>
            </CardContent>
          ) : null}
        </TabsContent>
      </Tabs>
    </>
  );
}
