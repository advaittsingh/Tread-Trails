-- AlterTable
ALTER TABLE "User" ADD COLUMN "preferredVehicleSlug" TEXT;

-- CreateTable
CREATE TABLE "UserSavedVehicle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSavedVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSavedVehicle_userId_vehicleSlug_key" ON "UserSavedVehicle"("userId", "vehicleSlug");

-- CreateIndex
CREATE INDEX "UserSavedVehicle_userId_idx" ON "UserSavedVehicle"("userId");

-- AddForeignKey
ALTER TABLE "UserSavedVehicle" ADD CONSTRAINT "UserSavedVehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
