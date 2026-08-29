import type {
  CursorListQuery,
  CursorPage,
} from '../../../platform/http/cursor-pagination';
import type {
  Enrollment,
  EnrollmentListItem,
  EnrollmentStatus,
  PrintedStatusFilter,
} from '../domain/enrollment';

export const ENROLLMENT_REPOSITORY = Symbol('ENROLLMENT_REPOSITORY');

export type CreateEnrollmentRecordInput = {
  id: string;
  enrollmentId: string;
  idempotencyId: string;
  capturedAt: Date | null;
  status: EnrollmentStatus;
  category: string;
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

export type ListEnrollmentsQuery = CursorListQuery & {
  wardId?: string;
  wardIds?: string[];
  healthFacilityId?: string;
  enrolledByUserId?: string;
  search?: string;
  status?: EnrollmentStatus;
  category?: string;
  printedStatus?: PrintedStatusFilter;
  lga?: string;
  beneficiaryName?: string;
  enrollmentId?: string;
  createdFrom?: Date;
  createdTo?: Date;
};

export type IdCardEnrollmentData = {
  id: string;
  enrollmentId: string;
  wardId: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  emergencyPhone: string;
  bloodGroup: Enrollment['bloodGroup'];
  passportObjectKey: string;
  facilityName: string;
};

export type PaginatedEnrollments = CursorPage<EnrollmentListItem>;

export interface EnrollmentRepository {
  allocateEnrollmentId(year: number): Promise<string>;
  create(input: CreateEnrollmentRecordInput): Promise<Enrollment>;
  findById(id: string): Promise<Enrollment | null>;
  findByIdempotencyId(idempotencyId: string): Promise<Enrollment | null>;
  findByIdentityKey(input: {
    firstNameNormalized: string;
    lastNameNormalized: string;
    dateOfBirth: Date;
  }): Promise<Enrollment | null>;
  findManyByIds(ids: string[]): Promise<IdCardEnrollmentData[]>;
  markPrinted(ids: string[], printedAt: Date): Promise<void>;
  list(query: ListEnrollmentsQuery): Promise<PaginatedEnrollments>;
}
