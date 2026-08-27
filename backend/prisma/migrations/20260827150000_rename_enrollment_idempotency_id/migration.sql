ALTER TABLE "Enrollment" RENAME COLUMN "clientRequestId" TO "idempotencyId";
ALTER INDEX "Enrollment_clientRequestId_key" RENAME TO "Enrollment_idempotencyId_key";
