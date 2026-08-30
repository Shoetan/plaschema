-- CreateTable
CREATE TABLE "CapitationRun" (
    "id" UUID NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "rate" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" UUID NOT NULL,

    CONSTRAINT "CapitationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapitationRecord" (
    "id" UUID NOT NULL,
    "runId" UUID NOT NULL,
    "healthFacilityId" UUID NOT NULL,
    "facilityName" TEXT NOT NULL,
    "lga" TEXT NOT NULL,
    "beneficiaryCount" INTEGER NOT NULL,
    "rate" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "CapitationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CapitationRun_year_month_createdAt_idx" ON "CapitationRun"("year", "month", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CapitationRecord_runId_idx" ON "CapitationRecord"("runId");

-- CreateIndex
CREATE INDEX "CapitationRecord_healthFacilityId_idx" ON "CapitationRecord"("healthFacilityId");

-- AddForeignKey
ALTER TABLE "CapitationRun" ADD CONSTRAINT "CapitationRun_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapitationRecord" ADD CONSTRAINT "CapitationRecord_runId_fkey" FOREIGN KEY ("runId") REFERENCES "CapitationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapitationRecord" ADD CONSTRAINT "CapitationRecord_healthFacilityId_fkey" FOREIGN KEY ("healthFacilityId") REFERENCES "HealthFacility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
