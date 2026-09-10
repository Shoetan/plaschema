-- CreateEnum
CREATE TYPE "HouseholdRole" AS ENUM ('head', 'member');

-- CreateTable
CREATE TABLE "Household" (
    "id" UUID NOT NULL,
    "householdLocalId" UUID NOT NULL,
    "householdCode" TEXT NOT NULL,
    "wardId" UUID NOT NULL,
    "headEnrollmentId" UUID,
    "baseEnrollmentId" TEXT,
    "residentialAddress" TEXT,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN "householdId" UUID,
ADD COLUMN "householdRole" "HouseholdRole",
ADD COLUMN "memberSequence" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Household_householdLocalId_key" ON "Household"("householdLocalId");
CREATE UNIQUE INDEX "Household_headEnrollmentId_key" ON "Household"("headEnrollmentId");
CREATE UNIQUE INDEX "Household_baseEnrollmentId_key" ON "Household"("baseEnrollmentId");
CREATE INDEX "Household_wardId_idx" ON "Household"("wardId");
CREATE UNIQUE INDEX "Household_wardId_householdCode_key" ON "Household"("wardId", "householdCode");
CREATE INDEX "Enrollment_householdId_idx" ON "Enrollment"("householdId");

-- AddForeignKey
ALTER TABLE "Household" ADD CONSTRAINT "Household_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Household" ADD CONSTRAINT "Household_headEnrollmentId_fkey" FOREIGN KEY ("headEnrollmentId") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
