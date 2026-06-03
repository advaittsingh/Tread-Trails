-- Inventory management
CREATE TYPE "InventoryMovementType" AS ENUM (
  'manual_add',
  'manual_remove',
  'adjustment',
  'transfer_out',
  'transfer_in',
  'customer_order',
  'purchase_order',
  'damaged',
  'incoming'
);

CREATE TABLE "ProductInventory" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "stockQuantity" INTEGER NOT NULL DEFAULT 0,
  "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
  "incomingQuantity" INTEGER NOT NULL DEFAULT 0,
  "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProductInventory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryMovement" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "inventoryId" TEXT NOT NULL,
  "type" "InventoryMovementType" NOT NULL,
  "quantity" INTEGER NOT NULL,
  "quantityBefore" INTEGER NOT NULL,
  "quantityAfter" INTEGER NOT NULL,
  "note" TEXT NOT NULL DEFAULT '',
  "referenceId" TEXT,
  "adminId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventorySettings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "defaultLowStockThreshold" INTEGER NOT NULL DEFAULT 5,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InventorySettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductInventory_productId_key" ON "ProductInventory"("productId");
CREATE UNIQUE INDEX "ProductInventory_sku_key" ON "ProductInventory"("sku");
CREATE INDEX "ProductInventory_stockQuantity_idx" ON "ProductInventory"("stockQuantity");

CREATE INDEX "InventoryMovement_productId_createdAt_idx" ON "InventoryMovement"("productId", "createdAt");
CREATE INDEX "InventoryMovement_inventoryId_createdAt_idx" ON "InventoryMovement"("inventoryId", "createdAt");
CREATE INDEX "InventoryMovement_type_idx" ON "InventoryMovement"("type");
CREATE INDEX "InventoryMovement_createdAt_idx" ON "InventoryMovement"("createdAt");

ALTER TABLE "ProductInventory" ADD CONSTRAINT "ProductInventory_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_inventoryId_fkey"
  FOREIGN KEY ("inventoryId") REFERENCES "ProductInventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_adminId_fkey"
  FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "InventorySettings" ("id", "defaultLowStockThreshold", "updatedAt")
VALUES ('default', 5, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
