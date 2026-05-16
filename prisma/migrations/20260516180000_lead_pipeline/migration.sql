-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('contact', 'corporate');
CREATE TYPE "LeadStatus" AS ENUM ('new', 'contacted', 'qualified', 'converted', 'closed');
CREATE TYPE "LeadPriority" AS ENUM ('low', 'normal', 'high', 'urgent');

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "source" "LeadSource" NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'new',
    "priority" "LeadPriority" NOT NULL DEFAULT 'normal',
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT,
    "message" TEXT,
    "companyName" TEXT,
    "contactPerson" TEXT,
    "businessType" TEXT,
    "requirements" TEXT,
    "adminNotes" TEXT NOT NULL DEFAULT '',
    "assignedToId" TEXT,
    "inboxSubmissionId" TEXT,
    "contactedAt" TIMESTAMP(3),
    "qualifiedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LeadEmailLog" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "adminId" TEXT,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "template" TEXT,
    "bodyPreview" TEXT,
    "provider" TEXT,
    "messageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_inboxSubmissionId_key" ON "Lead"("inboxSubmissionId");
CREATE INDEX "Lead_status_createdAt_idx" ON "Lead"("status", "createdAt");
CREATE INDEX "Lead_source_createdAt_idx" ON "Lead"("source", "createdAt");
CREATE INDEX "Lead_priority_idx" ON "Lead"("priority");
CREATE INDEX "Lead_assignedToId_idx" ON "Lead"("assignedToId");
CREATE INDEX "Lead_email_idx" ON "Lead"("email");
CREATE INDEX "LeadEmailLog_leadId_createdAt_idx" ON "LeadEmailLog"("leadId", "createdAt");
CREATE INDEX "LeadEmailLog_adminId_idx" ON "LeadEmailLog"("adminId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_inboxSubmissionId_fkey" FOREIGN KEY ("inboxSubmissionId") REFERENCES "InboxSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LeadEmailLog" ADD CONSTRAINT "LeadEmailLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadEmailLog" ADD CONSTRAINT "LeadEmailLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill leads from existing inbox submissions
INSERT INTO "Lead" (
    "id", "source", "status", "priority", "displayName", "email", "phone",
    "subject", "message", "companyName", "contactPerson", "businessType", "requirements",
    "adminNotes", "inboxSubmissionId", "createdAt", "updatedAt"
)
SELECT
    ('lead_' || i."id"),
    CASE WHEN i."kind" = 'contact' THEN 'contact'::"LeadSource" ELSE 'corporate'::"LeadSource" END,
    CASE WHEN i."readAt" IS NOT NULL THEN 'contacted'::"LeadStatus" ELSE 'new'::"LeadStatus" END,
    'normal'::"LeadPriority",
    CASE
        WHEN i."kind" = 'contact' THEN COALESCE(i."payload"->>'name', 'Contact lead')
        ELSE COALESCE(i."payload"->>'companyName', 'Corporate lead')
    END,
    COALESCE(i."payload"->>'email', 'unknown@treadtrails.local'),
    NULLIF(TRIM(i."payload"->>'phone'), ''),
    CASE WHEN i."kind" = 'contact' THEN i."payload"->>'subject' ELSE NULL END,
    CASE WHEN i."kind" = 'contact' THEN i."payload"->>'message' ELSE NULL END,
    CASE WHEN i."kind" = 'corporate' THEN i."payload"->>'companyName' ELSE NULL END,
    CASE WHEN i."kind" = 'corporate' THEN i."payload"->>'contactPerson' ELSE NULL END,
    CASE WHEN i."kind" = 'corporate' THEN i."payload"->>'businessType' ELSE NULL END,
    CASE WHEN i."kind" = 'corporate' THEN i."payload"->>'requirements' ELSE NULL END,
    '',
    i."id",
    i."createdAt",
    i."createdAt"
FROM "InboxSubmission" i
WHERE NOT EXISTS (
    SELECT 1 FROM "Lead" l WHERE l."inboxSubmissionId" = i."id"
);
