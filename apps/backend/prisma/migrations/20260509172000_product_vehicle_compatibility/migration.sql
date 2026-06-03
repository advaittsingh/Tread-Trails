-- CreateTable
CREATE TABLE "ProductVehicleCompatibility" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductVehicleCompatibility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductVehicleCompatibility_productId_vehicleId_key" ON "ProductVehicleCompatibility"("productId", "vehicleId");

-- CreateIndex
CREATE INDEX "ProductVehicleCompatibility_vehicleId_idx" ON "ProductVehicleCompatibility"("vehicleId");

-- CreateIndex
CREATE INDEX "ProductVehicleCompatibility_productId_idx" ON "ProductVehicleCompatibility"("productId");

-- AddForeignKey
ALTER TABLE "ProductVehicleCompatibility" ADD CONSTRAINT "ProductVehicleCompatibility_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductVehicleCompatibility" ADD CONSTRAINT "ProductVehicleCompatibility_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill rows from legacy array (skips slugs with no matching Vehicle row)
INSERT INTO "ProductVehicleCompatibility" ("id", "productId", "vehicleId", "createdAt")
SELECT gen_random_uuid()::text, p."id", v."id", CURRENT_TIMESTAMP
FROM "Product" p
CROSS JOIN LATERAL unnest(COALESCE(p."compatibleCars", ARRAY[]::text[])) AS t(slug)
INNER JOIN "Vehicle" v ON v."slug" = t.slug;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "compatibleCars";
