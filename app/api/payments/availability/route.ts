import { NextResponse } from "next/server";

import {
  isJuspayConfigured,
  isRazorpayConfigured,
  isStripePaymentsConfigured,
} from "@/lib/payments/gateway-env";

/** Public capability flags for checkout UI — no secrets exposed */
export async function GET() {
  return NextResponse.json({
    stripe: isStripePaymentsConfigured(),
    razorpay: isRazorpayConfigured(),
    juspay: isJuspayConfigured(),
    cod: true,
  });
}
