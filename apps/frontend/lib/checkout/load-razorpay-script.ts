const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

export function loadRazorpayCheckoutScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (document.querySelector(`script[src="${RAZORPAY_SCRIPT}"]`)) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = RAZORPAY_SCRIPT;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Razorpay Checkout script"));
    document.body.appendChild(s);
  });
}

export type RazorpayWindow = {
  Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
};
