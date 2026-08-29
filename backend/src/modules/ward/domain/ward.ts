export type WardStatus = 'active' | 'inactive';

export const WARD_STATUSES: WardStatus[] = ['active', 'inactive'];

/** Plateau State is fixed for this CBHI deployment. */
export const WARD_STATE = 'Plateau' as const;

export type Ward = {
  id: string;
  name: string;
  lga: string;
  status: WardStatus;
  createdAt: Date;
  updatedAt: Date;
};

/** Slim row for the wards admin table (GET /wards list). */
export type WardListItem = {
  id: string;
  name: string;
  state: typeof WARD_STATE;
  lga: string;
  fieldWorkers: number;
  beneficiaries: number;
  /** Enrollments created on the current calendar day (Africa/Lagos). */
  newEnrollments: number;
  status: WardStatus;
};

export type WardDetailStats = {
  totalBeneficiaries: number;
  activeFieldWorkers: number;
  enrollmentsThisMonth: number;
  lastActivityAt: Date | null;
};

export type WardEnrollmentTrendPoint = {
  month: string;
  label: string;
  count: number;
};

export type WardDetailFieldWorker = {
  id: string;
  name: string;
  phone: string | null;
  enrolled: number;
  lastEnrollmentAt: Date | null;
  lastSyncedAt: Date | null;
  status: 'active' | 'inactive';
};

export type WardDetailHealthFacility = {
  id: string;
  name: string;
  type: string;
  level: 'primary' | 'secondary' | 'tertiary';
  ward: { id: string; name: string };
  beneficiaries: number;
  status: 'active' | 'inactive';
};

export type WardDetailAggregates = {
  stats: WardDetailStats;
  enrollmentTrend: WardEnrollmentTrendPoint[];
  fieldWorkers: WardDetailFieldWorker[];
  healthFacilities: WardDetailHealthFacility[];
};
