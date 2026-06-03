-- User management: account status + session invalidation

CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended');

ALTER TABLE "User" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'active';
ALTER TABLE "User" ADD COLUMN "sessionInvalidatedAt" TIMESTAMP(3);

CREATE INDEX "User_status_idx" ON "User"("status");
