import { useEffect, useState } from "react";
import { usePatchProduct, useProductBundle } from "@/api/products/hooks";
import { AutomotiveBadges } from "@/components/orders/automotive-badges";
import { VehicleTreeSelector } from "./vehicle-tree-selector";
import { PublicationBadge } from "./publication-badge";
import { StockIndicator } from "./stock-indicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatInr } from "@/lib/format";
import type { OrderAutomotiveMeta } from "@/api/orders/types";

export function ProductDetailDrawer({
  productId,
  open,
  onOpenChange,
}: {
  productId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const q = useProductBundle(productId);
  const patchMut = usePatchProduct(productId ?? "");

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [vehicleSlugs, setVehicleSlugs] = useState<string[]>([]);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  useEffect(() => {
    if (!q.data) return;
    const p = q.data.product;
    setName(p.name);
    setBrand(p.brand);
    setCategory(p.category);
    setPrice(p.price != null ? String(p.price) : "");
    setDescription(p.description);
    setVehicleSlugs(q.data.vehicleSlugs);
    setMetaTitle(q.data.seo?.metaTitle ?? p.name);
    setMetaDescription(q.data.seo?.metaDescription ?? p.description.slice(0, 160));
  }, [q.data]);

  const list = q.data?.list;
  const automotive: OrderAutomotiveMeta | undefined = list
    ? {
        vehicleLabel: list.compatibleVehicles[0] ?? "—",
        primaryBrand: list.brand,
        fitmentStatus: list.hasCompatibility ? "verified" : "unverified",
        fitmentLabel: list.hasCompatibility
          ? `${list.compatibleVehicleCount} vehicles`
          : "No fitment",
        installationBookingStatus: "none",
        installationBookingLabel: "N/A",
      }
    : undefined;

  const save = () => {
    if (!productId) return;
    patchMut.mutate(
      {
        name,
        brand,
        category,
        price: price ? Number(price) : null,
        description,
        vehicleSlugs,
      },
      {
        onSuccess: () => toast({ title: "Product saved" }),
        onError: (e: Error) =>
          toast({ title: "Save failed", description: e.message, variant: "destructive" }),
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
        <SheetHeader className="px-6 py-4 border-b sticky top-0 bg-white z-10">
          <SheetTitle className="text-left text-base">
            {list?.name ?? "Product"}
          </SheetTitle>
          {list && (
            <div className="flex flex-wrap gap-2 pt-1">
              <PublicationBadge status={list.publicationStatus} />
              <StockIndicator status={list.stockStatus} />
              {automotive && (
                <AutomotiveBadges automotive={automotive} compact />
              )}
            </div>
          )}
        </SheetHeader>

        <div className="px-6 py-4">
          {q.isLoading && <Skeleton className="h-40 w-full" />}

          {q.data && (
            <Tabs defaultValue="general">
              <TabsList className="grid grid-cols-3 w-full mb-4">
                <TabsTrigger value="general" className="text-xs">
                  General
                </TabsTrigger>
                <TabsTrigger value="inventory" className="text-xs">
                  Inventory
                </TabsTrigger>
                <TabsTrigger value="compat" className="text-xs">
                  Fitment
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <section>
                  <h3 className="text-xs font-semibold uppercase text-stone-500 mb-2">
                    General information
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Name</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Brand</Label>
                        <Input value={brand} onChange={(e) => setBrand(e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Category</Label>
                        <Input value={category} onChange={(e) => setCategory(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Description</Label>
                      <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                  </div>
                </section>
                <section>
                  <h3 className="text-xs font-semibold uppercase text-stone-500 mb-2">
                    Pricing
                  </h3>
                  <Label className="text-xs">Selling price (INR, paise)</Label>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Leave empty for POA"
                  />
                </section>
                <section>
                  <h3 className="text-xs font-semibold uppercase text-stone-500 mb-2">
                    SEO
                  </h3>
                  <div className="space-y-2">
                    <Input
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder="Meta title"
                    />
                    <Textarea
                      rows={2}
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      placeholder="Meta description"
                    />
                    <p className="text-[10px] text-stone-500">
                      Path: {q.data.seo?.path ?? `/products/${q.data.product.slug}`}
                    </p>
                  </div>
                </section>
                <section>
                  <h3 className="text-xs font-semibold uppercase text-stone-500 mb-2">
                    Specifications
                  </h3>
                  <ul className="text-xs space-y-1">
                    {q.data.product.specs.map((s) => (
                      <li key={s.label} className="flex justify-between border-b border-stone-50 py-1">
                        <span className="text-stone-500">{s.label}</span>
                        <span>{s.value}</span>
                      </li>
                    ))}
                    {q.data.product.specs.length === 0 && (
                      <li className="text-stone-500">No specs defined</li>
                    )}
                  </ul>
                </section>
              </TabsContent>

              <TabsContent value="inventory" className="space-y-3">
                <h3 className="text-xs font-semibold uppercase text-stone-500">
                  Inventory
                </h3>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md bg-stone-50 p-3 border">
                    <dt className="text-xs text-stone-500">SKU</dt>
                    <dd className="font-mono text-xs">{list?.sku}</dd>
                  </div>
                  <div className="rounded-md bg-stone-50 p-3 border">
                    <dt className="text-xs text-stone-500">Available</dt>
                    <dd className="font-semibold tabular-nums">{list?.available}</dd>
                  </div>
                  <div className="rounded-md bg-stone-50 p-3 border">
                    <dt className="text-xs text-stone-500">On hand</dt>
                    <dd className="tabular-nums">{list?.stock}</dd>
                  </div>
                  <div className="rounded-md bg-stone-50 p-3 border">
                    <dt className="text-xs text-stone-500">Value</dt>
                    <dd className="tabular-nums">{formatInr(list?.inventoryValue ?? 0)}</dd>
                  </div>
                </dl>
                {list?.reorderAlert && (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded px-3 py-2">
                    Reorder alert: stock at or below threshold ({list.lowStockThreshold}).
                  </p>
                )}
              </TabsContent>

              <TabsContent value="compat" className="space-y-3">
                <h3 className="text-xs font-semibold uppercase text-stone-500">
                  Vehicle compatibility
                </h3>
                <VehicleTreeSelector
                  selectedSlugs={vehicleSlugs}
                  onChange={setVehicleSlugs}
                />
              </TabsContent>

              <Button className="w-full mt-4" onClick={save} disabled={patchMut.isPending}>
                Save product
              </Button>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
