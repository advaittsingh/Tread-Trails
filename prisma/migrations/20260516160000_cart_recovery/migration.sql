-- AlterTable
ALTER TABLE "CartTelemetry" ADD COLUMN "customerName" TEXT,
ADD COLUMN "recoveryEmailSentAt" TIMESTAMP(3),
ADD COLUMN "recoveryWhatsappAt" TIMESTAMP(3),
ADD COLUMN "recoveryTemplate" TEXT,
ADD COLUMN "recoveredAt" TIMESTAMP(3),
ADD COLUMN "convertedAt" TIMESTAMP(3),
ADD COLUMN "convertedOrderId" TEXT;

-- CreateTable
CREATE TABLE "CartRecoveryLog" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "template" TEXT,
    "adminId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartRecoveryLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CartRecoveryLog_sessionId_idx" ON "CartRecoveryLog"("sessionId");

-- CreateIndex
CREATE INDEX "CartRecoveryLog_createdAt_idx" ON "CartRecoveryLog"("createdAt");

-- CreateIndex
CREATE INDEX "CartRecoveryLog_adminId_createdAt_idx" ON "CartRecoveryLog"("adminId", "createdAt");

-- CreateIndex
CREATE INDEX "CartTelemetry_recoveryEmailSentAt_idx" ON "CartTelemetry"("recoveryEmailSentAt");

-- CreateIndex
CREATE INDEX "CartTelemetry_convertedAt_idx" ON "CartTelemetry"("convertedAt");

-- AddForeignKey
ALTER TABLE "CartRecoveryLog" ADD CONSTRAINT "CartRecoveryLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CartTelemetry"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;
