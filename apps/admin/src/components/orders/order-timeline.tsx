import { Check, Circle } from "lucide-react";
import type { OrderDetail } from "@/api/orders/types";
import { cn } from "@/lib/utils";
import { formatShortDate } from "@/lib/format";

const STEPS = [
  { key: "created", label: "Order Created", field: "createdAt" as const },
  { key: "paid", label: "Payment Captured", field: "paidAt" as const },
  { key: "packed", label: "Packed", field: "packedAt" as const },
  { key: "shipped", label: "Shipped", field: "shippedAt" as const },
  { key: "delivered", label: "Delivered", field: "deliveredAt" as const },
];

function stepState(stepKey: string, order: OrderDetail) {
  if (order.status === "cancelled") {
    return stepKey === "created" ? "done" : "cancelled";
  }
  const rank: Record<string, number> = {
    pending: 0,
    paid: 1,
    packed: 2,
    shipped: 3,
    delivered: 4,
  };
  const stepRank: Record<string, number> = {
    created: 0,
    paid: 1,
    packed: 2,
    shipped: 3,
    delivered: 4,
  };
  const current = rank[order.status] ?? 0;
  const step = stepRank[stepKey] ?? 0;
  if (step < current) return "done";
  if (step === current) return "current";
  return "pending";
}

export function OrderTimeline({ order }: { order: OrderDetail }) {
  return (
    <ol className="flex flex-col sm:flex-row sm:items-start gap-0 sm:gap-2">
      {STEPS.map((step, idx) => {
        const state = stepState(step.key, order);
        const at = order[step.field];
        return (
          <li
            key={step.key}
            className={cn(
              "flex sm:flex-col items-start gap-2 sm:gap-1 flex-1 min-w-0 pb-4 sm:pb-0",
              idx < STEPS.length - 1 && "sm:border-r sm:border-stone-100 sm:pr-2"
            )}
          >
            <div className="flex items-center gap-2 sm:flex-col sm:items-start">
              <div
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center shrink-0 border",
                  state === "done" && "bg-stone-900 border-stone-900 text-white",
                  state === "current" && "bg-white border-stone-900 text-stone-900",
                  state === "pending" && "bg-stone-50 border-stone-200 text-stone-400",
                  state === "cancelled" && "bg-red-50 border-red-200 text-red-400"
                )}
              >
                {state === "done" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
              </div>
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-xs font-medium",
                    state === "pending" ? "text-stone-400" : "text-stone-900"
                  )}
                >
                  {step.label}
                </p>
                {at && (
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    {formatShortDate(at)}
                  </p>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
