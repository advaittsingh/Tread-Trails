import Stripe from "stripe";

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(key);
}

/** INR: Stripe expects paise (smallest currency unit). */
export function inrToStripeAmount(wholeRupees: number): number {
  return Math.round(wholeRupees * 100);
}
