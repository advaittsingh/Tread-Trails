/**
 * Vehicle / chassis selection — explicit UX contracts:
 *
 * Global chassis context: `SelectedVehicleProvider` + `localStorage` (`tread-trails-selected-vehicle-v1`).
 * Cleared via navbar banner “Clear” or programmatic `clearSelectedVehicle()`.
 *
 * 1. **Booking (`BookingForm` step 0)** — Required single-choice `<select>`.
 *    Options = full fleet (`data/cars` slugs). Values align with `/vehicle/[slug]` hubs and `?vehicle=` query prefill.
 *
 * 2. **Product PDP (`ProductPurchasePanel`)** — Optional single-choice `<select>` for concierge context only.
 *    Options = intersection of `cars` × `product.compatibleCars` (sorted by name). Feeds `booking?vehicle=` when set.
 *
 * 3. **Catalog (`FilterControls` on `/products`)** — Multi-select checkboxes (“Vehicle fitment”).
 *    Narrows SKU grid only; not wired into checkout/booking unless user navigates separately.
 */
export const VEHICLE_PLATFORM_SELECT_PLACEHOLDER = "Choose platform…";

/** Booking wizard step titles (4 steps, linear). */
export const BOOKING_VEHICLE_FLOW_STEP_TITLES = [
  "Vehicle platform",
  "Service program",
  "Schedule",
  "Contact details",
] as const;
