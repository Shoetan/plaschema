-- AlterTable
ALTER TABLE "Ward" ADD COLUMN "code" TEXT;

-- Derive `<LGA_3>-<NAME_3>` for existing rows; suffix duplicates with -2, -3, …
WITH letters AS (
  SELECT
    id,
    upper(substring(regexp_replace("lga", '[^a-zA-Z]', '', 'g') FROM 1 FOR 3)) AS lga_prefix,
    upper(substring(regexp_replace("name", '[^a-zA-Z]', '', 'g') FROM 1 FOR 3)) AS name_prefix
  FROM "Ward"
),
bases AS (
  SELECT
    id,
    lga_prefix || '-' || name_prefix AS base_code
  FROM letters
  WHERE lga_prefix <> '' AND name_prefix <> ''
),
ranked AS (
  SELECT
    id,
    base_code,
    row_number() OVER (PARTITION BY base_code ORDER BY id) AS rn
  FROM bases
)
UPDATE "Ward" AS w
SET "code" = CASE
  WHEN r.rn = 1 THEN r.base_code
  ELSE r.base_code || '-' || r.rn::text
END
FROM ranked AS r
WHERE w.id = r.id;

-- Fallback for rows without enough alphabetic characters (should not occur in production data)
UPDATE "Ward" SET "code" = 'LEGACY-' || "id"::text WHERE "code" IS NULL;

ALTER TABLE "Ward" ALTER COLUMN "code" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Ward_code_key" ON "Ward"("code");
