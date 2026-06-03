-- CreateTable
CREATE TABLE "PortfolioBuild" (
    "id" TEXT NOT NULL,
    "legacyId" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "vehicleSlug" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "beforeImage" TEXT NOT NULL,
    "afterImage" TEXT NOT NULL,
    "gallery" TEXT[],
    "productIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioBuild_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioBuild_legacyId_key" ON "PortfolioBuild"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioBuild_slug_key" ON "PortfolioBuild"("slug");

-- CreateIndex
CREATE INDEX "PortfolioBuild_vehicleSlug_idx" ON "PortfolioBuild"("vehicleSlug");
