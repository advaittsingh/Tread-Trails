-- CreateTable
CREATE TABLE "PortfolioBuildProduct" (
    "id" TEXT NOT NULL,
    "portfolioBuildId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PortfolioBuildProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioBuildProduct_portfolioBuildId_productId_key" ON "PortfolioBuildProduct"("portfolioBuildId", "productId");

-- CreateIndex
CREATE INDEX "PortfolioBuildProduct_productId_idx" ON "PortfolioBuildProduct"("productId");

-- AddForeignKey
ALTER TABLE "PortfolioBuildProduct" ADD CONSTRAINT "PortfolioBuildProduct_portfolioBuildId_fkey" FOREIGN KEY ("portfolioBuildId") REFERENCES "PortfolioBuild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioBuildProduct" ADD CONSTRAINT "PortfolioBuildProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
