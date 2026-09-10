import type { Enrollment } from '../domain/enrollment';

export type CreateEnrollmentInput = {
  /** Required offline idempotency key (UUID v7). */
  idempotencyId: string;
  capturedAt?: string | null;
  /** Beneficiary category label shown in admin tables. */
  category: string;
  passportObjectKey: string;
  idDocumentObjectKey: string;
  title: Enrollment['title'];
  gender: Enrollment['gender'];
  firstName: string;
  lastName: string;
  middleName?: string | null;
  dateOfBirth: string;
  phone: string;
  email?: string | null;
  nin?: string | null;
  maritalStatus: Enrollment['maritalStatus'];
  bloodGroup?: Enrollment['bloodGroup'];
  genotype?: Enrollment['genotype'];
  idType: Enrollment['idType'];
  emergencyPhone?: string | null;
  stateOfResidence?: string;
  lgaOfResidence: string;
  residentialAddress: string;
  wardId: string;
  healthFacilityId: string;
};
