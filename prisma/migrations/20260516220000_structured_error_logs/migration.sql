-- AlterTable
ALTER TABLE "AppErrorLog" ADD COLUMN "severity" TEXT NOT NULL DEFAULT 'error',
ADD COLUMN "category" TEXT NOT NULL DEFAULT 'api',
ADD COLUMN "route" TEXT,
ADD COLUMN "stack" TEXT,
ADD COLUMN "userId" TEXT;

UPDATE "AppErrorLog" SET "category" = "source" WHERE "category" = 'api' AND "source" IS NOT NULL;

-- CreateIndex
CREATE INDEX "AppErrorLog_severity_createdAt_idx" ON "AppErrorLog"("severity", "createdAt");
CREATE INDEX "AppErrorLog_category_createdAt_idx" ON "AppErrorLog"("category", "createdAt");
CREATE INDEX "AppErrorLog_route_idx" ON "AppErrorLog"("route");
