export type HealthFacilityStatus = 'active' | 'inactive';
export type HealthFacilityLevel = 'primary' | 'secondary' | 'tertiary';

export const HEALTH_FACILITY_STATUSES: HealthFacilityStatus[] = [
  'active',
  'inactive',
];

export const HEALTH_FACILITY_LEVELS: HealthFacilityLevel[] = [
  'primary',
  'secondary',
  'tertiary',
];

export const DEFAULT_HEALTH_FACILITY_TYPE = 'Primary Health Care';
export const DEFAULT_HEALTH_FACILITY_LEVEL: HealthFacilityLevel = 'primary';

export type HealthFacilityWard = {
  id: string;
  name: string;
  lga: string;
};

export type HealthFacility = {
  id: string;
  name: string;
  lga: string;
  type: string;
  level: HealthFacilityLevel;
  status: HealthFacilityStatus;
  wardId: string;
  ward: HealthFacilityWard;
  createdAt: Date;
  updatedAt: Date;
};

/** Slim row for the facilities admin table (GET /health-facilities list). */
export type HealthFacilityListItem = {
  id: string;
  name: string;
  type: string;
  level: HealthFacilityLevel;
  /** Joined ward (includes LGA). */
  ward: HealthFacilityWard;
  beneficiaries: number;
  status: HealthFacilityStatus;
};

export type HealthFacilityDetailStats = {
  totalBeneficiaries: number;
  enrollmentsThisMonth: number;
  /** Stub until capitation billing is implemented. */
  currentCapitation: null;
  lastActivityAt: Date | null;
};

export type HealthFacilityCapitationStub = {
  implemented: false;
  currentAmount: null;
  currency: 'NGN';
  records: [];
};

export type HealthFacilityDetailAggregates = {
  stats: HealthFacilityDetailStats;
};
