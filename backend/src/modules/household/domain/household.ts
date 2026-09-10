export type HouseholdRole = 'head' | 'member';

export const HOUSEHOLD_ROLES: HouseholdRole[] = ['head', 'member'];

export type Household = {
  id: string;
  householdLocalId: string;
  householdCode: string;
  wardId: string;
  headEnrollmentId: string | null;
  baseEnrollmentId: string | null;
  residentialAddress: string | null;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type HouseholdListItem = {
  id: string;
  householdLocalId: string;
  householdCode: string;
  wardId: string;
  ward: { id: string; name: string; lga: string; code: string };
  headName: string | null;
  memberCount: number;
  residentialAddress: string | null;
  createdAt: Date;
};

export type HouseholdMemberSummary = {
  id: string;
  enrollmentId: string;
  householdRole: HouseholdRole;
  memberSequence: number | null;
  firstName: string;
  lastName: string;
  status: string;
};

export type HouseholdDetail = {
  household: Household & {
    ward: { id: string; name: string; lga: string; code: string };
  };
  head: HouseholdMemberSummary | null;
  members: HouseholdMemberSummary[];
};
