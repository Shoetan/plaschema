-- CreateEnum
CREATE TYPE "ActivityCategory" AS ENUM ('enrollment', 'ward', 'user', 'sync');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('created', 'updated', 'status_changed', 'printed', 'assigned');

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" UUID NOT NULL,
    "category" "ActivityCategory" NOT NULL,
    "action" "ActivityAction" NOT NULL,
    "summary" TEXT NOT NULL,
    "wardId" UUID NOT NULL,
    "actorUserId" UUID,
    "enrollmentId" UUID,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityLog_wardId_occurredAt_idx" ON "ActivityLog"("wardId", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "ActivityLog_wardId_category_occurredAt_idx" ON "ActivityLog"("wardId", "category", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "ActivityLog_enrollmentId_idx" ON "ActivityLog"("enrollmentId");

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
