import { randomBytes } from "node:crypto";

export function newJuspayMerchantOrderRef(): string {
  return randomBytes(10).toString("hex").slice(0, 20);
}
