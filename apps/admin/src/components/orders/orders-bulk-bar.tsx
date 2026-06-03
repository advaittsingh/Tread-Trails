import {
  Download,
  Package,
  Printer,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useState } from "react";

const BULK_STATUSES = ["paid", "packed", "shipped", "delivered"] as const;
const CARRIERS = [
  "Blue Dart",
  "Delhivery",
  "DTDC",
  "FedEx",
  "India Post",
  "Professional Couriers",
  "Self / studio pickup",
  "Other",
];

export function OrdersBulkBar({
  selectedCount,
  onBulkStatus,
  onExport,
  onPrintLabels,
  isUpdating,
}: {
  selectedCount: number;
  onBulkStatus: (status: string, carrier?: string) => void;
  onExport: () => void;
  onPrintLabels: () => void;
  isUpdating?: boolean;
}) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [courierOpen, setCourierOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string>("packed");
  const [carrier, setCarrier] = useState("Delhivery");

  if (selectedCount === 0) {
    return (
      <div className="flex flex-wrap items-center gap-2 py-2 border-b border-stone-100">
        <Button type="button" variant="outline" size="sm" className="h-8" onClick={onExport}>
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export orders
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 py-2 px-1 bg-stone-900 text-white rounded-md mb-2">
        <span className="text-xs font-medium px-2">{selectedCount} selected</span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setStatusOpen(true)}
          disabled={isUpdating}
        >
          <Package className="h-3 w-3 mr-1" />
          Update status
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-7 text-xs"
          onClick={onExport}
        >
          <Download className="h-3 w-3 mr-1" />
          Export
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-7 text-xs"
          onClick={onPrintLabels}
        >
          <Printer className="h-3 w-3 mr-1" />
          Print labels
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setCourierOpen(true)}
          disabled={isUpdating}
        >
          <Truck className="h-3 w-3 mr-1" />
          Assign courier
        </Button>
      </div>

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk update status</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>New status</Label>
            <Select value={bulkStatus} onValueChange={setBulkStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BULK_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onBulkStatus(bulkStatus);
                setStatusOpen(false);
              }}
              disabled={isUpdating}
            >
              Apply to {selectedCount} orders
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={courierOpen} onOpenChange={setCourierOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign courier</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Carrier</Label>
            <Select value={carrier} onValueChange={setCarrier}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CARRIERS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourierOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onBulkStatus("shipped", carrier);
                setCourierOpen(false);
              }}
              disabled={isUpdating}
            >
              Assign & mark shipped
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
