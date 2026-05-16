-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'delivered';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "trackingNumber" TEXT,
ADD COLUMN "shippingCarrier" TEXT,
ADD COLUMN "paidAt" TIMESTAMP(3),
ADD COLUMN "shippedAt" TIMESTAMP(3),
ADD COLUMN "deliveredAt" TIMESTAMP(3),
ADD COLUMN "cancelledAt" TIMESTAMP(3);
