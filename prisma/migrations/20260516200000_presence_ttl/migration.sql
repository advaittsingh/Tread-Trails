-- AlterTable
ALTER TABLE "PresenceSession" ADD COLUMN "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "deviceType" TEXT,
ADD COLUMN "deviceLabel" TEXT;

-- Backfill session start from last activity for existing rows
UPDATE "PresenceSession" SET "firstSeenAt" = "lastSeenAt" WHERE "firstSeenAt" IS NULL;

-- CreateIndex
CREATE INDEX "PresenceSession_lastSeenAt_idx" ON "PresenceSession"("lastSeenAt");

-- Remove sessions already past TTL (3 minutes)
DELETE FROM "PresenceSession" WHERE "lastSeenAt" < NOW() - INTERVAL '3 minutes';
