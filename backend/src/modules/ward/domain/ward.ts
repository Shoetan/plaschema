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
