-- AlterTable
ALTER TABLE "Order" ADD COLUMN "razorpayOrderId" TEXT;
ALTER TABLE "Order" ADD COLUMN "razorpayPaymentId" TEXT;
ALTER TABLE "Order" ADD COLUMN "juspayGatewayOrderId" TEXT;
ALTER TABLE "Order" ADD COLUMN "juspayCheckoutOrderRef" TEXT;
