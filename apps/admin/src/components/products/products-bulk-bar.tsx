import { useState } from "react";
import { Download, IndianRupee, Link2, Package, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleTreeSelector } from "./vehicle-tree-selector";

export function ProductsBulkBar({
  selectedCount,
  onExport,
  onBulk,
  isPending,
}: {
  selectedCount: number;
  onExport: () => void;
  onBulk: (payload: {
    brand?: string;
    category?: string;
    priceDelta?: number;
    stockDelta?: number;
    vehicleSlugs?: string[];
  }) => void;
  isPending?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [priceDelta, setPriceDelta] = useState("");
  const [stockDelta, setStockDelta] = useState("");
  const [vehicleSlugs, setVehicleSlugs] = useState<string[]>([]);
  const [tab, setTab] = useState("edit");

  const apply = () => {
    onBulk({
      brand: brand || undefined,
      category: category || undefined,
      priceDelta: priceDelta ? Number(priceDelta) : undefined,
      stockDelta: stockDelta ? Number(stockDelta) : undefined,
      vehicleSlugs: vehicleSlugs.length > 0 ? vehicleSlugs : undefined,
    });
    setOpen(false);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 py-2 border-b border-stone-100">
        {selectedCount > 0 && (
          <span className="text-xs font-medium bg-stone-900 text-white px-2 py-1 rounded">
            {selectedCount} selected
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={onExport}
        >
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export products
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          disabled={selectedCount === 0}
          onClick={() => setOpen(true)}
        >
          <Pencil className="h-3.5 w-3.5 mr-1.5" />
          Bulk operations
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk update {selectedCount} products</DialogTitle>
          </DialogHeader>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="edit" className="text-xs">
                Edit
              </TabsTrigger>
              <TabsTrigger value="pricing" className="text-xs">
                Pricing
              </TabsTrigger>
              <TabsTrigger value="inventory" className="text-xs">
                Stock
              </TabsTrigger>
              <TabsTrigger value="compat" className="text-xs">
                Fitment
              </TabsTrigger>
            </TabsList>
            <TabsContent value="edit" className="space-y-3 pt-3">
              <div>
                <Label className="text-xs">Brand</Label>
                <Input value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} />
              </div>
            </TabsContent>
            <TabsContent value="pricing" className="space-y-3 pt-3">
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <IndianRupee className="h-3 w-3" />
                  Price delta (paise)
                </Label>
                <Input
                  type="number"
                  value={priceDelta}
                  onChange={(e) => setPriceDelta(e.target.value)}
                  placeholder="e.g. 500 for +₹5"
                />
              </div>
            </TabsContent>
            <TabsContent value="inventory" className="space-y-3 pt-3">
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  Stock delta (units)
                </Label>
                <Input
                  type="number"
                  value={stockDelta}
                  onChange={(e) => setStockDelta(e.target.value)}
                />
              </div>
            </TabsContent>
            <TabsContent value="compat" className="pt-3">
              <Label className="text-xs flex items-center gap-1 mb-2">
                <Link2 className="h-3 w-3" />
                Replace vehicle fitment
              </Label>
              <VehicleTreeSelector
                selectedSlugs={vehicleSlugs}
                onChange={setVehicleSlugs}
                maxHeight={220}
              />
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={apply} disabled={isPending}>
              Apply bulk update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
