-- CreateTable
CREATE TABLE "VehicleMake" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleMake_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VehicleModel" (
    "id" TEXT NOT NULL,
    "makeId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleModel_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN "modelId" TEXT,
ADD COLUMN "generationKey" TEXT,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "VehicleMake_slug_key" ON "VehicleMake"("slug");
CREATE INDEX "VehicleMake_sortOrder_idx" ON "VehicleMake"("sortOrder");
CREATE UNIQUE INDEX "VehicleModel_makeId_slug_key" ON "VehicleModel"("makeId", "slug");
CREATE INDEX "VehicleModel_makeId_idx" ON "VehicleModel"("makeId");
CREATE INDEX "Vehicle_modelId_idx" ON "Vehicle"("modelId");
CREATE INDEX "Vehicle_category_idx" ON "Vehicle"("category");

-- AddForeignKey
ALTER TABLE "VehicleModel" ADD CONSTRAINT "VehicleModel_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "VehicleMake"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "VehicleModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
