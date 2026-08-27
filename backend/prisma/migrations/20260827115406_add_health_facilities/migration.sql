-- CreateTable
CREATE TABLE "HealthFacility" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "lga" TEXT NOT NULL,
    "wardId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthFacility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HealthFacility_wardId_idx" ON "HealthFacility"("wardId");

-- CreateIndex
CREATE INDEX "HealthFacility_lga_idx" ON "HealthFacility"("lga");

-- CreateIndex
CREATE UNIQUE INDEX "HealthFacility_name_wardId_key" ON "HealthFacility"("name", "wardId");

-- AddForeignKey
ALTER TABLE "HealthFacility" ADD CONSTRAINT "HealthFacility_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
