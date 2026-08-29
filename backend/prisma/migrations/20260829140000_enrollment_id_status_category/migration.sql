-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('pending', 'active', 'disabled', 'deceased');

-- CreateTable
CREATE TABLE "EnrollmentYearCounter" (
    "year" INTEGER NOT NULL,
    "lastValue" INTEGER NOT NULL,

    CONSTRAINT "EnrollmentYearCounter_pkey" PRIMARY KEY ("year")
);

-- AlterTable
ALTER TABLE "Enrollment"
ADD COLUMN "enrollmentId" TEXT,
ADD COLUMN "status" "EnrollmentStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Unspecified';

-- Backfill human-readable enrollment IDs for any existing rows (ordered by createdAt).
WITH numbered AS (
  SELECT
    "id",
    EXTRACT(YEAR FROM "createdAt")::INT AS year,
    ROW_NUMBER() OVER (
      PARTITION BY EXTRACT(YEAR FROM "createdAt")
      ORDER BY "createdAt" ASC, "id" ASC
    ) AS seq
  FROM "Enrollment"
  WHERE "enrollmentId" IS NULL
)
UPDATE "Enrollment" AS e
SET "enrollmentId" = 'PL/CBHI/' || numbered.year::TEXT || '/' || LPAD(numbered.seq::TEXT, 3, '0')
FROM numbered
WHERE e."id" = numbered."id";

-- Seed year counters from backfilled (or empty) data.
INSERT INTO "EnrollmentYearCounter" ("year", "lastValue")
SELECT
  EXTRACT(YEAR FROM "createdAt")::INT AS year,
  COUNT(*)::INT AS "lastValue"
FROM "Enrollment"
GROUP BY EXTRACT(YEAR FROM "createdAt")
ON CONFLICT ("year") DO UPDATE
SET "lastValue" = EXCLUDED."lastValue";

ALTER TABLE "Enrollment"
ALTER COLUMN "enrollmentId" SET NOT NULL,
ALTER COLUMN "category" DROP DEFAULT;

CREATE UNIQUE INDEX "Enrollment_enrollmentId_key" ON "Enrollment"("enrollmentId");
CREATE INDEX "Enrollment_status_idx" ON "Enrollment"("status");
