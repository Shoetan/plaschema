-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN "printedAt" TIMESTAMP(3),
ADD COLUMN "printCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Enrollment_category_idx" ON "Enrollment"("category");

-- CreateIndex
CREATE INDEX "Enrollment_printedAt_idx" ON "Enrollment"("printedAt");
