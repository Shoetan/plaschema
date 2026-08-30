export type CapitationListSortRow = {
  id: string;
  facilityName: string;
  beneficiaryCount: number;
};

/** Highest beneficiary count first; zero-beneficiary facilities last. */
export function sortCapitationListRecords<T extends CapitationListSortRow>(
  records: T[],
): T[] {
  return [...records].sort((a, b) => {
    if (b.beneficiaryCount !== a.beneficiaryCount) {
      return b.beneficiaryCount - a.beneficiaryCount;
    }
    const byName = a.facilityName.localeCompare(b.facilityName);
    if (byName !== 0) {
      return byName;
    }
    return a.id.localeCompare(b.id);
  });
}

export type CapitationRecordDraft = {
  healthFacilityId: string;
  facilityName: string;
  lga: string;
  beneficiaryCount: number;
  rate: number;
  amount: number;
};

export type CapitationRunSummary = {
  runId: string;
  month: number;
  year: number;
  rate: number;
  generatedAt: Date;
  totalFacilities: number;
  totalBeneficiaries: number;
  totalCapitation: number;
};

export type CapitationPreviewResult = {
  month: number;
  year: number;
  rate: number;
  totalFacilities: number;
  totalBeneficiaries: number;
  totalCapitation: number;
  records: CapitationRecordDraft[];
};

export type CapitationGenerateResult = CapitationRunSummary & {
  recordCount: number;
};

export type CapitationRecordListItem = {
  id: string;
  healthFacilityId: string;
  facilityName: string;
  lga: string;
  month: number;
  year: number;
  period: string;
  beneficiaryCount: number;
  rate: number;
  amount: number;
};

export type CapitationListSummary = Omit<
  CapitationRunSummary,
  'runId'
> & {
  runId: string | null;
};

export type CapitationHistoryItem = {
  month: number;
  year: number;
  period: string;
  beneficiaryCount: number;
  rate: number;
  amount: number;
  generatedAt: Date;
};

export type HealthFacilityCapitationDetail = {
  implemented: true;
  currentAmount: number | null;
  currency: 'NGN';
  records: CapitationHistoryItem[];
};
