import type { Enrollment } from '../domain/enrollment';

export const ENROLLMENT_REPOSITORY = Symbol('ENROLLMENT_REPOSITORY');

export type CreateEnrollmentRecordInput = {
  id: string;
  idempotencyId: string;
  capturedAt: Date | null;
  enrolledByUserId: string;
  wardId: string;
  healthFacilityId: string;
  passportObjectKey: string;
  idDocumentObjectKey: string;
  title: Enrollment['title'];
  gender: Enrollment['gender'];
  firstName: string;
  lastName: string;
  middleName: string | null;
  firstNameNormalized: string;
  lastNameNormalized: string;
  dateOfBirth: Date;
  phone: string;
  email: string | null;
  nin: string | null;
  maritalStatus: Enrollment['maritalStatus'];
  bloodGroup: Enrollment['bloodGroup'];
  genotype: Enrollment['genotype'];
  idType: Enrollment['idType'];
  nextOfKinFullName: string;
  emergencyPhone: string;
  nextOfKinRelationship: Enrollment['nextOfKinRelationship'];
  stateOfResidence: string;
  lgaOfResidence: string;
  residentialAddress: string;
};

export type ListEnrollmentsQuery = {
  page: number;
  pageSize: number;
  wardId?: string;
  wardIds?: string[];
  enrolledByUserId?: string;
  search?: string;
};

export type PaginatedEnrollments = {
  items: Enrollment[];
  total: number;
  page: number;
  pageSize: number;
};

export interface EnrollmentRepository {
  create(input: CreateEnrollmentRecordInput): Promise<Enrollment>;
  findById(id: string): Promise<Enrollment | null>;
  findByIdempotencyId(idempotencyId: string): Promise<Enrollment | null>;
  findByIdentityKey(input: {
    firstNameNormalized: string;
    lastNameNormalized: string;
    dateOfBirth: Date;
  }): Promise<Enrollment | null>;
  list(query: ListEnrollmentsQuery): Promise<PaginatedEnrollments>;
}
