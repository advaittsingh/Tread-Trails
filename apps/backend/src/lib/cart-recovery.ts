import { prisma } from "./prisma.js";

export async function markCartsConvertedForEmail(
  customerEmail: string,
  orderId: string
): Promise<void> {
  const email = customerEmail.trim().toLowerCase();
  if (!email) return;

  try {
    const carts = await prisma.cartTelemetry.findMany({
      where: {
        userEmail: email,
        itemCount: { gt: 0 },
        convertedAt: null,
      },
    });

    if (carts.length === 0) return;

    await prisma.cartTelemetry.updateMany({
      where: { id: { in: carts.map((c) => c.id) } },
      data: { convertedAt: new Date(), convertedOrderId: orderId },
    });
  } catch (e) {
    console.error("[cart-recovery] mark converted failed", e);
  }
}
