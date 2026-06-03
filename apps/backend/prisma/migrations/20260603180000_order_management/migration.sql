-- Order management: packed status + internal notes

ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'packed';

ALTER TABLE "Order" ADD COLUMN "packedAt" TIMESTAMP(3);

CREATE TABLE "OrderInternalNote" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "adminId" TEXT,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OrderInternalNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderInternalNote_orderId_createdAt_idx" ON "OrderInternalNote"("orderId", "createdAt");

ALTER TABLE "OrderInternalNote" ADD CONSTRAINT "OrderInternalNote_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderInternalNote" ADD CONSTRAINT "OrderInternalNote_adminId_fkey"
  FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
