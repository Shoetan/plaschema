import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
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
  BLOOD_GROUPS,
  ENROLLMENT_GENDERS,
  ENROLLMENT_TITLES,
  GENOTYPES,
  ID_DOCUMENT_TYPES,
  MARITAL_STATUSES,
  NEXT_OF_KIN_RELATIONSHIPS,
  type BloodGroup,
  type EnrollmentGender,
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
    description: 'Object key returned by POST /enrollments/files (passport)',
  })
  @IsString()
  @IsNotEmpty()
  passportObjectKey!: string;

  @ApiProperty({
    description: 'Object key returned by POST /enrollments/files (id_document)',
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
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('7')
  wardId?: string;

  @ApiPropertyOptional({
    description: 'When true, only enrollments created by the current user',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  enrolledByMe?: boolean;

  @ApiPropertyOptional({ example: 'Ada' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  search?: string;
}

export class EnrollmentUploadResponseDto {
  @ApiProperty()
  objectKey!: string;

  @ApiProperty()
  contentType!: string;

  @ApiProperty()
  size!: number;

  @ApiProperty({ enum: ['passport', 'id_document'] })
  purpose!: 'passport' | 'id_document';

  @ApiProperty()
  url!: string;
}

export class EnrollmentRefDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;
}

export class EnrollmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  idempotencyId!: string;

  @ApiPropertyOptional()
  capturedAt!: Date | null;

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

  @ApiProperty()
  lgaOfResidence!: string;

  @ApiProperty()
  residentialAddress!: string;

  @ApiProperty({ type: EnrollmentRefDto })
  ward!: EnrollmentRefDto;

  @ApiProperty({ type: EnrollmentRefDto })
  healthFacility!: EnrollmentRefDto;

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
