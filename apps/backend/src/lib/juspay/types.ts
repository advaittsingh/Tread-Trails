export type JuspaySessionResult =
  | {
      ok: true;
      gatewayOrderId: string;
      merchantOrderRef: string;
      paymentLinkWeb: string;
    }
  | { ok: false; error: string };
