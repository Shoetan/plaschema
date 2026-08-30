-- CreateEnum
CREATE TYPE "FileJobKind" AS ENUM ('id_card', 'enrollment_report');

-- CreateEnum
CREATE TYPE "FileJobFormat" AS ENUM ('pdf', 'xlsx');

-- CreateEnum
CREATE TYPE "FileJobStatus" AS ENUM ('queued', 'processing', 'failed', 'completed');

-- CreateTable
CREATE TABLE "FileJob" (
    "id" UUID NOT NULL,
    "requestedByUserId" UUID NOT NULL,
    "kind" "FileJobKind" NOT NULL,
    "format" "FileJobFormat" NOT NULL,
    "status" "FileJobStatus" NOT NULL DEFAULT 'queued',
    "statusRank" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "objectKey" TEXT,
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "FileJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FileJob_requestedByUserId_statusRank_createdAt_id_idx" ON "FileJob"("requestedByUserId", "statusRank", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "FileJob_status_idx" ON "FileJob"("status");

-- AddForeignKey
ALTER TABLE "FileJob" ADD CONSTRAINT "FileJob_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
