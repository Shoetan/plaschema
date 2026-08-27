-- CreateEnum
CREATE TYPE "EnrollmentTitle" AS ENUM ('mr', 'mrs', 'miss', 'ms', 'dr', 'chief', 'rev', 'alhaji', 'hajia', 'other');

-- CreateEnum
CREATE TYPE "EnrollmentGender" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('single', 'married', 'divorced', 'widowed', 'separated');

-- CreateEnum
CREATE TYPE "BloodGroup" AS ENUM ('a_pos', 'a_neg', 'b_pos', 'b_neg', 'ab_pos', 'ab_neg', 'o_pos', 'o_neg', 'unknown');

-- CreateEnum
CREATE TYPE "Genotype" AS ENUM ('aa', 'as', 'ss', 'ac', 'sc', 'unknown');

-- CreateEnum
CREATE TYPE "IdDocumentType" AS ENUM ('nin', 'national_id', 'voters_card', 'drivers_license', 'international_passport', 'other');

-- CreateEnum
CREATE TYPE "NextOfKinRelationship" AS ENUM ('spouse', 'parent', 'sibling', 'child', 'relative', 'friend', 'other');

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" UUID NOT NULL,
    "clientRequestId" UUID NOT NULL,
    "capturedAt" TIMESTAMP(3),
    "enrolledByUserId" UUID NOT NULL,
    "wardId" UUID NOT NULL,
    "healthFacilityId" UUID NOT NULL,
    "passportObjectKey" TEXT NOT NULL,
    "idDocumentObjectKey" TEXT NOT NULL,
    "title" "EnrollmentTitle" NOT NULL,
    "gender" "EnrollmentGender" NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "firstNameNormalized" TEXT NOT NULL,
    "lastNameNormalized" TEXT NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "nin" TEXT,
    "maritalStatus" "MaritalStatus" NOT NULL,
    "bloodGroup" "BloodGroup",
    "genotype" "Genotype",
    "idType" "IdDocumentType" NOT NULL,
    "nextOfKinFullName" TEXT NOT NULL,
    "emergencyPhone" TEXT NOT NULL,
    "nextOfKinRelationship" "NextOfKinRelationship",
    "stateOfResidence" TEXT NOT NULL DEFAULT 'Plateau',
    "lgaOfResidence" TEXT NOT NULL,
    "residentialAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_clientRequestId_key" ON "Enrollment"("clientRequestId");

-- CreateIndex
CREATE INDEX "Enrollment_wardId_idx" ON "Enrollment"("wardId");

-- CreateIndex
CREATE INDEX "Enrollment_healthFacilityId_idx" ON "Enrollment"("healthFacilityId");

-- CreateIndex
CREATE INDEX "Enrollment_enrolledByUserId_idx" ON "Enrollment"("enrolledByUserId");

-- CreateIndex
CREATE INDEX "Enrollment_createdAt_idx" ON "Enrollment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_identity_key" ON "Enrollment"("firstNameNormalized", "lastNameNormalized", "dateOfBirth");

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_enrolledByUserId_fkey" FOREIGN KEY ("enrolledByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_healthFacilityId_fkey" FOREIGN KEY ("healthFacilityId") REFERENCES "HealthFacility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
