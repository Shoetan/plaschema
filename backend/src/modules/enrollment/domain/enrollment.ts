export type EnrollmentTitle =
  | 'mr'
  | 'mrs'
  | 'miss'
  | 'ms'
  | 'dr'
  | 'chief'
  | 'rev'
  | 'alhaji'
  | 'hajia'
  | 'other';

export type EnrollmentGender = 'male' | 'female';

export type MaritalStatus =
  | 'single'
  | 'married'
  | 'divorced'
  | 'widowed'
  | 'separated';

export type BloodGroup =
  | 'a_pos'
  | 'a_neg'
  | 'b_pos'
  | 'b_neg'
  | 'ab_pos'
  | 'ab_neg'
  | 'o_pos'
  | 'o_neg'
  | 'unknown';

export type Genotype = 'aa' | 'as' | 'ss' | 'ac' | 'sc' | 'unknown';

export type IdDocumentType =
  | 'nin'
  | 'national_id'
  | 'voters_card'
  | 'drivers_license'
  | 'international_passport'
  | 'other';

export type NextOfKinRelationship =
  | 'spouse'
  | 'parent'
  | 'sibling'
  | 'child'
  | 'relative'
  | 'friend'
  | 'other';

export type EnrollmentRef = {
  id: string;
  name: string;
};

export type Enrollment = {
  id: string;
  idempotencyId: string;
  capturedAt: Date | null;
  enrolledByUserId: string;
  wardId: string;
  healthFacilityId: string;
  passportObjectKey: string;
  idDocumentObjectKey: string;
  title: EnrollmentTitle;
  gender: EnrollmentGender;
  firstName: string;
  lastName: string;
  middleName: string | null;
  dateOfBirth: string;
  phone: string;
  email: string | null;
  nin: string | null;
  maritalStatus: MaritalStatus;
  bloodGroup: BloodGroup | null;
  genotype: Genotype | null;
  idType: IdDocumentType;
  nextOfKinFullName: string;
  emergencyPhone: string;
  nextOfKinRelationship: NextOfKinRelationship | null;
  stateOfResidence: string;
  lgaOfResidence: string;
  residentialAddress: string;
  ward: EnrollmentRef;
  healthFacility: EnrollmentRef;
  enrolledBy: EnrollmentRef;
  createdAt: Date;
  updatedAt: Date;
  /** True when this response came from an idempotent replay. */
  idempotentReplay?: boolean;
};

export const ENROLLMENT_TITLES: EnrollmentTitle[] = [
  'mr',
  'mrs',
  'miss',
  'ms',
  'dr',
  'chief',
  'rev',
  'alhaji',
  'hajia',
  'other',
];

export const ENROLLMENT_GENDERS: EnrollmentGender[] = ['male', 'female'];

export const MARITAL_STATUSES: MaritalStatus[] = [
  'single',
  'married',
  'divorced',
  'widowed',
  'separated',
];

export const BLOOD_GROUPS: BloodGroup[] = [
  'a_pos',
  'a_neg',
  'b_pos',
  'b_neg',
  'ab_pos',
  'ab_neg',
  'o_pos',
  'o_neg',
  'unknown',
];

export const GENOTYPES: Genotype[] = ['aa', 'as', 'ss', 'ac', 'sc', 'unknown'];

export const ID_DOCUMENT_TYPES: IdDocumentType[] = [
  'nin',
  'national_id',
  'voters_card',
  'drivers_license',
  'international_passport',
  'other',
];

export const NEXT_OF_KIN_RELATIONSHIPS: NextOfKinRelationship[] = [
  'spouse',
  'parent',
  'sibling',
  'child',
  'relative',
  'friend',
  'other',
];
