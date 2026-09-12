import type {
  CursorListQuery,
  CursorPage,
} from '../../../platform/http/cursor-pagination';
import type { CreateEnrollmentRecordInput } from '../../enrollment/application/enrollment.repository';
import type { Enrollment } from '../../enrollment/domain/enrollment';
import type { Household, HouseholdDetail, HouseholdListItem } from '../domain/household';

export const HOUSEHOLD_REPOSITORY = Symbol('HOUSEHOLD_REPOSITORY');

export type CreateHouseholdHeadInput = {
  household: {
    id: string;
    householdLocalId: string;
    householdCode: string;
    wardId: string;
    residentialAddress: string | null;
  };
  enrollment: CreateEnrollmentRecordInput & {
    enrollmentId: string;
    householdRole: 'head';
  };
};

export type CreateHouseholdMemberInput = {
  householdId: string;
  enrollment: Omit<CreateEnrollmentRecordInput, 'enrollmentId'> & {
    householdRole: 'member';
  };
};

export type ListHouseholdsQuery = CursorListQuery & {
  wardId?: string;
  wardIds?: string[];
  lga?: string;
  search?: string;
  householdCode?: string;
};

export type PaginatedHouseholds = CursorPage<HouseholdListItem>;

export interface HouseholdRepository {
  findById(id: string): Promise<Household | null>;
  findByLocalId(householdLocalId: string): Promise<Household | null>;
  findByWardAndCode(wardId: string, householdCode: string): Promise<Household | null>;
  createHeadEnrollment(input: CreateHouseholdHeadInput): Promise<{
    household: Household;
    enrollment: Enrollment;
  }>;
  createMemberEnrollment(input: CreateHouseholdMemberInput): Promise<Enrollment>;
  findDetail(id: string): Promise<HouseholdDetail | null>;
  list(query: ListHouseholdsQuery): Promise<PaginatedHouseholds>;
  findWardIdsWithHouseholds(): Promise<string[]>;
  getHighestCodeSuffixByWardIds(wardIds: string[]): Promise<Map<string, number>>;
}
