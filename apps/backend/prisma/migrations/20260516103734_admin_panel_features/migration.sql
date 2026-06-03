-- CreateEnum
CREATE TYPE "InboxKind" AS ENUM ('contact', 'corporate');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "fulfilmentNotes" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "InboxSubmission" (
    "id" TEXT NOT NULL,
    "kind" "InboxKind" NOT NULL,
    "payload" JSONB NOT NULL,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InboxSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InboxSubmission_kind_createdAt_idx" ON "InboxSubmission"("kind", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_entity_entityId_idx" ON "AdminAuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminId_idx" ON "AdminAuditLog"("adminId");
