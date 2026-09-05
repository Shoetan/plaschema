-- Make next-of-kin fields optional on enrollment.
ALTER TABLE "Enrollment" ALTER COLUMN "nextOfKinFullName" DROP NOT NULL;
ALTER TABLE "Enrollment" ALTER COLUMN "emergencyPhone" DROP NOT NULL;
