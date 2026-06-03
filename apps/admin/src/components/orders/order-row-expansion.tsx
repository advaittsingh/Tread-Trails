import type {
  AdminOrderListRow,
  VehicleCompatibilityLine,
} from "@/api/orders/types";
import { formatInr } from "@/lib/format";

function formatAddress(
  addr: AdminOrderListRow["shippingAddress"]
): string[] {
  if (!addr) return ["No shipping address"];
  const lines = [addr.line1];
  if (addr.line2?.trim()) lines.push(addr.line2);
  lines.push(`${addr.city}, ${addr.region} ${addr.postal}`);
  return lines;
}

export function OrderRowExpansion({
  order,
  compatibility,
}: {
  order: AdminOrderListRow;
  compatibility?: VehicleCompatibilityLine[];
}) {
  const addressLines = formatAddress(order.shippingAddress);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 p-4 bg-stone-50/90 border-t border-stone-100 text-sm">
      <section>
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 mb-2">
          Products
        </h4>
        <ul className="space-y-2">
          {order.items.map((line) => (
            <li key={`${line.productSlug}-${line.variantId}`} className="text-xs">
              <span className="font-medium text-stone-900">{line.name}</span>
              <span className="text-stone-500 block">
                {line.variantLabel} × {line.quantity} ·{" "}
                {formatInr(line.unitPrice * line.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 mb-2">
          Vehicle compatibility
        </h4>
        {compatibility && compatibility.length > 0 ? (
          <ul className="space-y-2 text-xs">
            {compatibility.map((row) => (
              <li key={row.productSlug}>
                <span className="font-medium text-stone-800">{row.productName}</span>
                {row.vehicles.length > 0 ? (
                  <p className="text-stone-600 mt-0.5">
                    {row.vehicles.map((v) => v.vehicleName).join(", ")}
                  </p>
                ) : (
                  <p className="text-amber-700 mt-0.5">No fitment mapped</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-stone-500">
            Open order details for full fitment data.
          </p>
        )}
      </section>

      <section>
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 mb-2">
          Shipping address
        </h4>
        <address className="text-xs text-stone-700 not-italic leading-relaxed">
          {addressLines.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
        </address>
      </section>

      <section>
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 mb-2">
          Notes & tracking
        </h4>
        <dl className="text-xs space-y-1.5 text-stone-700">
          <div>
            <dt className="text-stone-500">Tracking</dt>
            <dd className="font-mono">{order.trackingNumber ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Carrier</dt>
            <dd>{order.shippingCarrier ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Internal notes</dt>
            <dd className="whitespace-pre-wrap">
              {order.fulfilmentNotes?.trim() || "—"}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
