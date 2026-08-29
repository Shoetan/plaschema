-- CreateEnum
CREATE TYPE "WardStatus" AS ENUM ('active', 'inactive');

-- AlterTable
ALTER TABLE "Ward"
ADD COLUMN "status" "WardStatus" NOT NULL DEFAULT 'active';

CREATE INDEX "Ward_status_idx" ON "Ward"("status");
CREATE INDEX "Ward_lga_idx" ON "Ward"("lga");
