import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
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
  type BloodGroup,
  type EnrollmentGender,
  type EnrollmentStatus,
  type EnrollmentTitle,
  type Genotype,
  type IdDocumentType,
  type MaritalStatus,
  type NextOfKinRelationship,
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

  @ApiProperty({ example: 'John Obi' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  nextOfKinFullName!: string;

  @ApiProperty({ example: '+2348098765432' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  emergencyPhone!: string;

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
    type: Boolean,
    description: 'When true, only enrollments created by the current user',
  })
  @Transform(({ value }) => toQueryBool(value))
  @IsOptional()
  @IsBoolean()
  enrolledByMe?: boolean;

  @ApiPropertyOptional({ enum: ENROLLMENT_STATUSES })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsEnum(ENROLLMENT_STATUSES)
  status?: EnrollmentStatus;

  @ApiPropertyOptional({ type: String, example: 'Ada' })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  search?: string;
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

  @ApiProperty()
  nextOfKinFullName!: string;

  @ApiProperty()
  emergencyPhone!: string;

  @ApiPropertyOptional({ enum: NEXT_OF_KIN_RELATIONSHIPS })
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

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional({
    description: 'Present when the create call was an idempotent replay',
  })
  idempotentReplay?: boolean;
}
