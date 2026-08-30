import type {
  CapitationGenerateResult,
  CapitationPreviewResult,
  CapitationRecordDraft,
  CapitationRecordListItem,
  CapitationRunSummary,
  HealthFacilityCapitationDetail,
} from '../domain/capitation';

export type ListCapitationsQuery = {
  month: number;
  year: number;
  cursor?: string;
  limit: number;
  lga?: string;
  healthFacilityId?: string;
  search?: string;
};

export type PaginatedCapitations = {
  items: CapitationRecordListItem[];
  summary: CapitationRunSummary | null;
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
};

export type CreateCapitationRunInput = {
  month: number;
  year: number;
  rate: number;
  createdByUserId: string;
  records: CapitationRecordDraft[];
};

export const CAPITATION_REPOSITORY = Symbol('CAPITATION_REPOSITORY');

export interface CapitationRepository {
  computeRecords(rate: number): Promise<CapitationRecordDraft[]>;
  preview(month: number, year: number, rate: number): Promise<CapitationPreviewResult>;
  createRun(input: CreateCapitationRunInput): Promise<CapitationGenerateResult>;
  list(query: ListCapitationsQuery): Promise<PaginatedCapitations>;
  findFacilityCapitation(
    healthFacilityId: string,
  ): Promise<HealthFacilityCapitationDetail>;
  findCurrentAmountForFacility(
    healthFacilityId: string,
    month: number,
    year: number,
  ): Promise<number | null>;
}
