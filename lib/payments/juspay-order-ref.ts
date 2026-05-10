import { randomBytes } from "crypto";

/** Alphanumeric, ≤21 chars — Juspay `order_id` constraint */
export function newJuspayMerchantOrderRef(): string {
  return randomBytes(10).toString("hex").slice(0, 20);
}
