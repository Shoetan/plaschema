-- CreateEnum
CREATE TYPE "HealthFacilityStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "HealthFacilityLevel" AS ENUM ('primary', 'secondary', 'tertiary');

-- AlterTable
ALTER TABLE "HealthFacility"
ADD COLUMN "type" TEXT NOT NULL DEFAULT 'Primary Health Care',
ADD COLUMN "level" "HealthFacilityLevel" NOT NULL DEFAULT 'primary',
ADD COLUMN "status" "HealthFacilityStatus" NOT NULL DEFAULT 'active';

CREATE INDEX "HealthFacility_status_idx" ON "HealthFacility"("status");
CREATE INDEX "HealthFacility_type_idx" ON "HealthFacility"("type");
CREATE INDEX "HealthFacility_level_idx" ON "HealthFacility"("level");
