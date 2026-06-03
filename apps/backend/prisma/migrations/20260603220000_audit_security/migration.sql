-- Admin audit: store previous and new values on change records

ALTER TABLE "AdminAuditLog" ADD COLUMN "previousValue" JSONB;
ALTER TABLE "AdminAuditLog" ADD COLUMN "newValue" JSONB;
