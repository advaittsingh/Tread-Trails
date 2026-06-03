-- AlterTable
ALTER TABLE "PortfolioBuild" ADD COLUMN "homeSpotlightRank" INTEGER;

-- CreateIndex
CREATE INDEX "PortfolioBuild_homeSpotlightRank_idx" ON "PortfolioBuild"("homeSpotlightRank");
