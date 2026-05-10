/** Server-side: whether each PSP can serve checkout from configured secrets */

export function isStripePaymentsConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function isRazorpayConfigured(): boolean {
  return Boolean(
    process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim()
  );
}

export function isJuspayConfigured(): boolean {
  return Boolean(
    process.env.JUSPAY_API_KEY?.trim() &&
      process.env.JUSPAY_MERCHANT_ID?.trim() &&
      process.env.JUSPAY_PAYMENT_PAGE_CLIENT_ID?.trim()
  );
}
