-- Rename legacy status value
ALTER TYPE "BookingStatus" RENAME VALUE 'requested' TO 'pending';

-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'completed';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "customerMessage" TEXT NOT NULL DEFAULT '',
ADD COLUMN "adminNotes" TEXT NOT NULL DEFAULT '',
ADD COLUMN "confirmedAt" TIMESTAMP(3),
ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "cancelledAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Booking_date_idx" ON "Booking"("date");
