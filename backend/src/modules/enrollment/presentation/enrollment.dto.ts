import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ArrayMaxSize,
  ArrayMinSize,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  EmptyStringToUndefined,
  toQueryBool,
  toQueryInt,
} from '../../../platform/http/query-transforms';
import {
  BLOOD_GROUPS,
  ENROLLMENT_GENDERS,
  ENROLLMENT_STATUSES,
  ENROLLMENT_TITLES,
  GENOTYPES,
  ID_DOCUMENT_TYPES,
  MARITAL_STATUSES,
  NEXT_OF_KIN_RELATIONSHIPS,
  PRINTED_STATUS_FILTERS,
  type BloodGroup,
  type EnrollmentGender,
  type EnrollmentStatus,
  type EnrollmentTitle,
  type Genotype,
  type IdDocumentType,
  type MaritalStatus,
  type NextOfKinRelationship,
  type PrintedStatusFilter,
} from '../domain/enrollment';

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export class CreateEnrollmentDto {
  @ApiProperty({
    format: 'uuid',
    description:
      'Required idempotency key (UUID v7). Retries with the same key return the original enrollment.',
  })
  @IsUUID('7')
  idempotencyId!: string;

  @ApiPropertyOptional({
    description:
      'When the form was captured on-device (ISO datetime). Useful for offline sync.',
  })
  @IsOptional()
  @IsDateString()
  capturedAt?: string;

  @ApiProperty({
    example: 'IDPs',
    description:
      'Beneficiary category shown in admin tables (e.g. IDPs, Elderly 65+, Indigents / Very Poor / Others)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  category!: string;

  @ApiProperty({
    description:
      'Object key returned by POST /enrollments/files/presign-upload (passport)',
  })
  @IsString()
  @IsNotEmpty()
  passportObjectKey!: string;

  @ApiProperty({
    description:
      'Object key returned by POST /enrollments/files/presign-upload (id_document)',
  })
  @IsString()
  @IsNotEmpty()
  idDocumentObjectKey!: string;

  @ApiProperty({ enum: ENROLLMENT_TITLES })
  @IsEnum(ENROLLMENT_TITLES)
  title!: EnrollmentTitle;

  @ApiProperty({ enum: ENROLLMENT_GENDERS })
  @IsEnum(ENROLLMENT_GENDERS)
  gender!: EnrollmentGender;

  @ApiProperty({ example: 'Ada' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string;

  @ApiProperty({ example: 'Obi' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(80)
  lastName!: string;

  @ApiPropertyOptional({ example: 'Chinedu' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  middleName?: string;

  @ApiProperty({
    example: '1990-05-04',
    description: 'Date of birth in ISO format YYYY-MM-DD',
  })
  @Matches(ISO_DATE_ONLY, { message: 'dateOfBirth must be YYYY-MM-DD' })
  dateOfBirth!: string;

  @ApiProperty({ example: '+2348012345678' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone!: string;

  @ApiPropertyOptional({ example: 'ada.obi@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @ApiPropertyOptional({ example: '70199989896' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  nin?: string;

  @ApiProperty({ enum: MARITAL_STATUSES })
  @IsEnum(MARITAL_STATUSES)
  maritalStatus!: MaritalStatus;

  @ApiPropertyOptional({ enum: BLOOD_GROUPS })
  @IsOptional()
  @IsEnum(BLOOD_GROUPS)
  bloodGroup?: BloodGroup;

  @ApiPropertyOptional({ enum: GENOTYPES })
  @IsOptional()
  @IsEnum(GENOTYPES)
  genotype?: Genotype;

  @ApiProperty({ enum: ID_DOCUMENT_TYPES })
  @IsEnum(ID_DOCUMENT_TYPES)
  idType!: IdDocumentType;

  @ApiPropertyOptional({ example: 'John Obi' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  nextOfKinFullName?: string;

  @ApiPropertyOptional({ example: '+2348098765432' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  emergencyPhone?: string;

  @ApiPropertyOptional({ enum: NEXT_OF_KIN_RELATIONSHIPS })
  @IsOptional()
  @IsEnum(NEXT_OF_KIN_RELATIONSHIPS)
  nextOfKinRelationship?: NextOfKinRelationship;

  @ApiPropertyOptional({ example: 'Plateau', default: 'Plateau' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  stateOfResidence?: string;

  @ApiProperty({ example: 'Jos North' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  lgaOfResidence!: string;

  @ApiProperty({ example: '12 Yakubu Gowon Way, Jos' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  residentialAddress!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('7')
  wardId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('7')
  healthFacilityId!: string;
}

export class ListEnrollmentsQueryDto {
  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    description: 'Cursor from the previous page nextCursor',
  })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsUUID('7')
  cursor?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 50,
    default: 50,
    minimum: 1,
    maximum: 100,
  })
  @Transform(({ value }) => toQueryInt(value, 50, { min: 1, max: 100 }))
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 50;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsUUID('7')
  wardId?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    description: 'Filter enrollments by health facility',
  })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsUUID('7')
  healthFacilityId?: string;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'When true, only enrollments created by the current user',
  })
  @Transform(({ value }) => toQueryBool(value))
  @IsOptional()
  @IsBoolean()
  enrolledByMe?: boolean;

  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    description: 'Admin only: filter enrollments by field worker user id',
  })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsUUID('7')
  enrolledByUserId?: string;

  @ApiPropertyOptional({ enum: ENROLLMENT_STATUSES })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsEnum(ENROLLMENT_STATUSES)
  status?: EnrollmentStatus;

  @ApiPropertyOptional({
    type: String,
    example: 'IDPs',
    description: 'Exact beneficiary category',
  })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;

  @ApiPropertyOptional({
    enum: PRINTED_STATUS_FILTERS,
    description: 'Filter by whether an ID card has been printed',
  })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsEnum(PRINTED_STATUS_FILTERS)
  printedStatus?: PrintedStatusFilter;

  @ApiPropertyOptional({
    type: String,
    example: 'Jos South',
    description: 'Filter by ward LGA (case-insensitive exact)',
  })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lga?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Musa',
    description: 'Search beneficiary first/middle/last name',
  })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  beneficiaryName?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'PL/CBHI/2026',
    description: 'Partial match on human-readable enrollment ID',
  })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  enrollmentId?: string;

  @ApiPropertyOptional({
    type: String,
    example: '2024-01-01',
    description: 'Inclusive createdAt lower bound (YYYY-MM-DD)',
  })
  @EmptyStringToUndefined()
  @IsOptional()
  @Matches(ISO_DATE_ONLY)
  createdFrom?: string;

  @ApiPropertyOptional({
    type: String,
    example: '2024-12-31',
    description: 'Inclusive createdAt upper bound (YYYY-MM-DD)',
  })
  @EmptyStringToUndefined()
  @IsOptional()
  @Matches(ISO_DATE_ONLY)
  createdTo?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Ada',
    description: 'Broad search across enrollmentId, name, phone, nin, category',
  })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  search?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 18,
    description: 'Minimum age (inclusive), computed from dateOfBirth',
    minimum: 0,
    maximum: 120,
  })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    return toQueryInt(value, 0, { min: 0, max: 120 });
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  ageMin?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 65,
    description: 'Maximum age (inclusive), computed from dateOfBirth',
    minimum: 0,
    maximum: 120,
  })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    return toQueryInt(value, 0, { min: 0, max: 120 });
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  ageMax?: number;
}

export class EnrollmentPresignUploadRequestDto {
  @ApiProperty({ enum: ['passport', 'id_document'] })
  @IsIn(['passport', 'id_document'])
  purpose!: 'passport' | 'id_document';

  @ApiProperty({
    example: 'image/jpeg',
    description: 'MIME type of the file that will be uploaded via PUT',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  contentType!: string;

  @ApiProperty({
    example: 'passport.jpg',
    description: 'Original filename (used only to derive extension)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  filename!: string;
}

export class EnrollmentPresignUploadResponseDto {
  @ApiProperty()
  objectKey!: string;

  @ApiProperty()
  contentType!: string;

  @ApiProperty({ enum: ['passport', 'id_document'] })
  purpose!: 'passport' | 'id_document';

  @ApiProperty({
    description:
      'Presigned Railway PUT URL. Send the file bytes with the same Content-Type.',
  })
  uploadUrl!: string;

  @ApiProperty({ example: 1800 })
  expiresInSeconds!: number;

  @ApiProperty({ enum: ['PUT'] })
  method!: 'PUT';
}

export class EnrollmentDevUploadResponseDto {
  @ApiProperty()
  objectKey!: string;

  @ApiProperty()
  contentType!: string;

  @ApiProperty({ enum: ['passport', 'id_document'] })
  purpose!: 'passport' | 'id_document';

  @ApiProperty()
  size!: number;
}

export class EnrollmentRefDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;
}

export class EnrollmentWardRefDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ example: 'Jos South' })
  lga!: string;
}

export class EnrollmentFacilityRefDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Vom Christian Hospital' })
  name!: string;

  @ApiProperty({ type: EnrollmentWardRefDto })
  ward!: EnrollmentWardRefDto;
}

export class EnrollmentListItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'PL/CBHI/2026/001' })
  enrollmentId!: string;

  @ApiProperty({ example: 'Musa Ibrahim' })
  beneficiaryName!: string;

  @ApiProperty({ example: 'IDPs' })
  category!: string;

  @ApiProperty({ enum: ENROLLMENT_STATUSES, example: 'pending' })
  status!: EnrollmentStatus;

  @ApiProperty({ type: EnrollmentFacilityRefDto })
  healthFacility!: EnrollmentFacilityRefDto;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({
    description: 'True when this enrollment has had an ID card printed at least once',
  })
  hasPrinted!: boolean;

  @ApiProperty({
    example: 0,
    description: 'How many times an ID card has been generated for this enrollment',
  })
  printCount!: number;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Timestamp of the most recent ID card print',
  })
  printedAt!: Date | null;
}

/** Slim create/sync acknowledgement — client already has the offline draft. */
export class CreateEnrollmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'PL/CBHI/2026/001' })
  enrollmentId!: string;

  @ApiProperty({ format: 'uuid' })
  idempotencyId!: string;

  @ApiProperty({ enum: ENROLLMENT_STATUSES, example: 'pending' })
  status!: EnrollmentStatus;

  @ApiPropertyOptional({
    nullable: true,
    description: 'When the form was captured on-device',
  })
  capturedAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({
    description: 'True when this create call was an idempotent replay',
  })
  idempotentReplay!: boolean;
}

export class EnrollmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'PL/CBHI/2026/001' })
  enrollmentId!: string;

  @ApiProperty({ format: 'uuid' })
  idempotencyId!: string;

  @ApiPropertyOptional()
  capturedAt!: Date | null;

  @ApiProperty({ enum: ENROLLMENT_STATUSES, example: 'pending' })
  status!: EnrollmentStatus;

  @ApiProperty({ example: 'IDPs' })
  category!: string;

  @ApiProperty({ format: 'uuid' })
  enrolledByUserId!: string;

  @ApiProperty({ format: 'uuid' })
  wardId!: string;

  @ApiProperty({ format: 'uuid' })
  healthFacilityId!: string;

  @ApiProperty()
  passportObjectKey!: string;

  @ApiProperty()
  idDocumentObjectKey!: string;

  @ApiProperty({
    description: 'Presigned Railway GET URL for the passport image (30m TTL)',
  })
  passportUrl!: string;

  @ApiProperty({
    description:
      'Presigned Railway GET URL for the ID document image (30m TTL)',
  })
  idDocumentUrl!: string;

  @ApiProperty({
    example: 1800,
    description: 'TTL in seconds for passportUrl and idDocumentUrl',
  })
  fileUrlExpiresInSeconds!: number;

  @ApiProperty({ enum: ENROLLMENT_TITLES })
  title!: EnrollmentTitle;

  @ApiProperty({ enum: ENROLLMENT_GENDERS })
  gender!: EnrollmentGender;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiPropertyOptional()
  middleName!: string | null;

  @ApiProperty({ example: '1990-05-04' })
  dateOfBirth!: string;

  @ApiProperty()
  phone!: string;

  @ApiPropertyOptional()
  email!: string | null;

  @ApiPropertyOptional()
  nin!: string | null;

  @ApiProperty({ enum: MARITAL_STATUSES })
  maritalStatus!: MaritalStatus;

  @ApiPropertyOptional({ enum: BLOOD_GROUPS })
  bloodGroup!: BloodGroup | null;

  @ApiPropertyOptional({ enum: GENOTYPES })
  genotype!: Genotype | null;

  @ApiProperty({ enum: ID_DOCUMENT_TYPES })
  idType!: IdDocumentType;

  @ApiPropertyOptional({ nullable: true })
  nextOfKinFullName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  emergencyPhone!: string | null;

  @ApiPropertyOptional({ enum: NEXT_OF_KIN_RELATIONSHIPS, nullable: true })
  nextOfKinRelationship!: NextOfKinRelationship | null;

  @ApiProperty()
  stateOfResidence!: string;

  @ApiProperty({
    description: 'Beneficiary residence LGA (address section), not facility LGA',
  })
  lgaOfResidence!: string;

  @ApiProperty()
  residentialAddress!: string;

  @ApiProperty({ type: EnrollmentWardRefDto })
  ward!: EnrollmentWardRefDto;

  @ApiProperty({ type: EnrollmentFacilityRefDto })
  healthFacility!: EnrollmentFacilityRefDto;

  @ApiProperty({ type: EnrollmentRefDto })
  enrolledBy!: EnrollmentRefDto;

  @ApiProperty({
    description: 'True when this enrollment has had an ID card printed at least once',
  })
  hasPrinted!: boolean;

  @ApiProperty({
    example: 0,
    description: 'How many times an ID card has been generated for this enrollment',
  })
  printCount!: number;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Timestamp of the most recent ID card print',
  })
  printedAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional({
    description: 'Present when the create call was an idempotent replay',
  })
  idempotentReplay?: boolean;
}

export class GenerateIdCardsRequestDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Enrollment UUIDs to print (1–9 for one A4 sheet)',
    minItems: 1,
    maxItems: 9,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(9)
  @IsUUID('7', { each: true })
  enrollmentIds!: string[];
}

export class UpdateEnrollmentStatusRequestDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Enrollment UUIDs to activate or deactivate (1–100)',
    minItems: 1,
    maxItems: 100,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID('7', { each: true })
  enrollmentIds!: string[];

  @ApiProperty({
    enum: ['active', 'disabled'],
    description: 'Target status. Use active to activate, disabled to deactivate.',
  })
  @IsIn(['active', 'disabled'])
  status!: 'active' | 'disabled';
}

export class PatchEnrollmentStatusRequestDto {
  @ApiProperty({
    enum: ['active', 'disabled'],
    description: 'Target status. Use active to activate, disabled to deactivate.',
  })
  @IsIn(['active', 'disabled'])
  status!: 'active' | 'disabled';
}

export class EnrollmentStatusSkipDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ['not_found', 'unchanged', 'invalid_transition'] })
  reason!: 'not_found' | 'unchanged' | 'invalid_transition';

  @ApiPropertyOptional({ enum: ENROLLMENT_STATUSES })
  currentStatus?: EnrollmentStatus;
}

export class UpdateEnrollmentStatusResponseDto {
  @ApiProperty({ enum: ['active', 'disabled'] })
  status!: 'active' | 'disabled';

  @ApiProperty({ example: 2 })
  updated!: number;

  @ApiProperty({ type: [String], format: 'uuid' })
  updatedIds!: string[];

  @ApiProperty({ type: EnrollmentStatusSkipDto, isArray: true })
  skipped!: EnrollmentStatusSkipDto[];
}

export class GenerateIdCardsResponseDto {
  @ApiProperty({ format: 'uuid' })
  jobId!: string;

  @ApiProperty({ enum: ['queued'] })
  status!: 'queued';
}

export class ExportEnrollmentReportRequestDto {
  @ApiProperty({
    enum: ['xlsx', 'pdf'],
    example: 'xlsx',
    description: 'Export format. Only xlsx is supported currently.',
  })
  @IsIn(['xlsx', 'pdf'])
  format!: 'xlsx' | 'pdf';

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsUUID('7')
  wardId?: string;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsUUID('7')
  healthFacilityId?: string;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsUUID('7')
  enrolledByUserId?: string;

  @ApiPropertyOptional({ enum: ENROLLMENT_STATUSES })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsEnum(ENROLLMENT_STATUSES)
  status?: EnrollmentStatus;

  @ApiPropertyOptional({ type: String, example: 'IDPs' })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;

  @ApiPropertyOptional({ type: String, example: 'Jos South' })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lga?: string;

  @ApiPropertyOptional({ type: String, example: '2024-01-01' })
  @EmptyStringToUndefined()
  @IsOptional()
  @Matches(ISO_DATE_ONLY)
  createdFrom?: string;

  @ApiPropertyOptional({ type: String, example: '2024-12-31' })
  @EmptyStringToUndefined()
  @IsOptional()
  @Matches(ISO_DATE_ONLY)
  createdTo?: string;

  @ApiPropertyOptional({ type: Number, example: 18, minimum: 0, maximum: 120 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  ageMin?: number;

  @ApiPropertyOptional({ type: Number, example: 65, minimum: 0, maximum: 120 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  ageMax?: number;
}

export class ExportEnrollmentReportResponseDto {
  @ApiProperty({ format: 'uuid' })
  jobId!: string;

  @ApiProperty({ enum: ['queued'] })
  status!: 'queued';
}

export class EnrollmentDetailPersonalDetailsDto {
  @ApiProperty({ example: 'Musa Ibrahim' })
  fullName!: string;

  @ApiProperty({ example: 'PL/CBHI/2026/001' })
  enrollmentId!: string;

  @ApiProperty({ example: '1985-03-15' })
  dateOfBirth!: string;

  @ApiProperty({ enum: ENROLLMENT_GENDERS })
  gender!: EnrollmentGender;

  @ApiPropertyOptional({ nullable: true, example: '12345678901' })
  nin!: string | null;

  @ApiProperty({ example: '+2348030000001' })
  phone!: string;

  @ApiProperty({ example: '15 Gwagwalada Road, FCT' })
  address!: string;
}

export class EnrollmentDetailOverviewDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Musa Ibrahim' })
  beneficiaryName!: string;

  @ApiProperty({ example: 'PL/CBHI/2026/001' })
  enrollmentId!: string;

  @ApiProperty({ enum: ENROLLMENT_STATUSES })
  status!: EnrollmentStatus;

  @ApiProperty({
    enum: ['synced'],
    description: 'Server-side enrollments are always synced',
  })
  syncStatus!: 'synced';

  @ApiProperty({ type: EnrollmentDetailPersonalDetailsDto })
  personalDetails!: EnrollmentDetailPersonalDetailsDto;
}

export class EnrollmentDetailActivityLogActorDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;
}

export class EnrollmentDetailActivityLogEntryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ['enrollment', 'ward', 'user', 'sync'] })
  category!: string;

  @ApiProperty({
    enum: ['created', 'updated', 'status_changed', 'printed', 'assigned'],
  })
  action!: string;

  @ApiProperty()
  summary!: string;

  @ApiProperty({ nullable: true, type: EnrollmentDetailActivityLogActorDto })
  actor!: EnrollmentDetailActivityLogActorDto | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  enrollmentId!: string | null;

  @ApiProperty()
  occurredAt!: Date;
}

export class EnrollmentDetailResponseDto {
  @ApiProperty({ type: EnrollmentDetailOverviewDto })
  overview!: EnrollmentDetailOverviewDto;

  @ApiProperty({
    type: EnrollmentDetailActivityLogEntryDto,
    isArray: true,
    description:
      'Unified activity feed for Synchronization and Activity History tabs',
  })
  activityLog!: EnrollmentDetailActivityLogEntryDto[];
}
