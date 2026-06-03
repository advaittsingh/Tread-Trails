import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AdminInventoryListRow, StockAdjustmentReason } from "@/api/inventory/types";
import { useStockAdjustment } from "@/api/inventory/hooks";
import { useToast } from "@/hooks/use-toast";

const REASONS: { value: StockAdjustmentReason; label: string }[] = [
  { value: "purchase", label: "Purchase" },
  { value: "damage", label: "Damage" },
  { value: "correction", label: "Correction" },
  { value: "return", label: "Return" },
  { value: "transfer", label: "Transfer" },
];

export function StockAdjustmentModal({
  open,
  onOpenChange,
  items,
  defaultProductId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: AdminInventoryListRow[];
  defaultProductId?: string | null;
}) {
  const { toast } = useToast();
  const adjustMut = useStockAdjustment();

  const [mode, setMode] = useState<"add" | "remove">("add");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState<StockAdjustmentReason>("purchase");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setProductId(defaultProductId ?? items[0]?.productId ?? "");
      setQuantity("1");
      setNotes("");
      setMode("add");
      setReason("purchase");
    }
  }, [open, defaultProductId, items]);

  const selected = items.find((i) => i.productId === productId);

  const submit = () => {
    if (!productId) return;
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      toast({ title: "Enter a valid quantity", variant: "destructive" });
      return;
    }
    adjustMut.mutate(
      { productId, mode, quantity: qty, reason, note: notes },
      {
        onSuccess: () => {
          toast({ title: "Stock adjusted" });
          onOpenChange(false);
        },
        onError: (e: Error) =>
          toast({ title: "Adjustment failed", description: e.message, variant: "destructive" }),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Stock Adjustment</DialogTitle>
        </DialogHeader>

        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as "add" | "remove")}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="add">Add Stock</TabsTrigger>
            <TabsTrigger value="remove">Remove Stock</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-3 pt-2">
          <div>
            <Label>Product</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Select SKU" />
              </SelectTrigger>
              <SelectContent>
                {items.map((i) => (
                  <SelectItem key={i.productId} value={i.productId}>
                    {i.sku} — {i.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected && (
              <p className="text-xs text-stone-500 mt-1">
                Available: {selected.availableQuantity} · {selected.brand}
              </p>
            )}
          </div>

          <div>
            <Label>Quantity</Label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div>
            <Label>Reason</Label>
            <Select
              value={reason}
              onValueChange={(v) => setReason(v as StockAdjustmentReason)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional reference or note"
            />
          </div>

          <Button
            className="w-full"
            onClick={submit}
            disabled={adjustMut.isPending || !productId}
          >
            Confirm adjustment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
