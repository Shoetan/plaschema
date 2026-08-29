import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  EmptyStringToUndefined,
  toQueryInt,
} from '../../../platform/http/query-transforms';
import {
  WARD_STATE,
  WARD_STATUSES,
  type WardStatus,
} from '../domain/ward';

export class CreateWardDto {
  @ApiProperty({ example: 'Vom Central' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'Jos South' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  lga!: string;

  @ApiPropertyOptional({ enum: WARD_STATUSES, default: 'active' })
  @IsOptional()
  @IsEnum(WARD_STATUSES)
  status?: WardStatus;
}

export class UpdateWardDto {
  @ApiPropertyOptional({ example: 'Vom Central' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'Jos South' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  lga?: string;

  @ApiPropertyOptional({ enum: WARD_STATUSES })
  @IsOptional()
  @IsEnum(WARD_STATUSES)
  status?: WardStatus;
}

export class ListWardsQueryDto {
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

  @ApiPropertyOptional({
    type: String,
    example: 'Vom',
    description: 'Search by ward name or LGA',
  })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ enum: WARD_STATUSES })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsEnum(WARD_STATUSES)
  status?: WardStatus;
}

export class StreamWardsQueryDto {
  @ApiPropertyOptional({
    type: String,
    description:
      'Only stream wards updated at or after this ISO datetime (incremental sync)',
  })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsDateString()
  updatedSince?: string;
}

export class WardListItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Vom Central' })
  name!: string;

  @ApiProperty({ example: WARD_STATE, description: 'Always Plateau for CBHI' })
  state!: typeof WARD_STATE;

  @ApiProperty({ example: 'Jos South' })
  lga!: string;

  @ApiProperty({ example: 3 })
  fieldWorkers!: number;

  @ApiProperty({ example: 412 })
  beneficiaries!: number;

  @ApiProperty({
    example: 48,
    description:
      'Enrollments created today (Africa/Lagos calendar day). UI may prefix with +.',
  })
  newEnrollments!: number;

  @ApiProperty({ enum: WARD_STATUSES, example: 'active' })
  status!: WardStatus;
}

export class WardResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ example: WARD_STATE })
  state!: typeof WARD_STATE;

  @ApiProperty()
  lga!: string;

  @ApiProperty({ enum: WARD_STATUSES })
  status!: WardStatus;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class WardDetailStatsDto {
  @ApiProperty({ example: 412 })
  totalBeneficiaries!: number;

  @ApiProperty({ example: 3 })
  activeFieldWorkers!: number;

  @ApiProperty({ example: 48 })
  enrollmentsThisMonth!: number;

  @ApiProperty({ nullable: true })
  lastActivityAt!: Date | null;
}

export class WardEnrollmentTrendPointDto {
  @ApiProperty({ example: '2026-08' })
  month!: string;

  @ApiProperty({ example: 'Aug' })
  label!: string;

  @ApiProperty({ example: 48 })
  count!: number;
}

export class WardDetailFieldWorkerDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  phone!: string | null;

  @ApiProperty({ example: 120 })
  enrolled!: number;

  @ApiProperty({ nullable: true })
  lastEnrollmentAt!: Date | null;

  @ApiProperty({ nullable: true })
  lastSyncedAt!: Date | null;

  @ApiProperty({ enum: ['active', 'inactive'] })
  status!: 'active' | 'inactive';
}

export class WardDetailHealthFacilityDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty({ enum: ['primary', 'secondary', 'tertiary'] })
  level!: 'primary' | 'secondary' | 'tertiary';

  @ApiProperty()
  ward!: { id: string; name: string };

  @ApiProperty({ example: 98 })
  beneficiaries!: number;

  @ApiProperty({ enum: ['active', 'inactive'] })
  status!: 'active' | 'inactive';
}

export class ActivityLogActorDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;
}

export class ActivityLogEntryDto {
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

  @ApiProperty({ nullable: true, type: ActivityLogActorDto })
  actor!: ActivityLogActorDto | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  enrollmentId!: string | null;

  @ApiProperty()
  occurredAt!: Date;
}

export class WardDetailResponseDto {
  @ApiProperty({ type: WardResponseDto })
  ward!: WardResponseDto;

  @ApiProperty({ type: WardDetailStatsDto })
  stats!: WardDetailStatsDto;

  @ApiProperty({ type: WardEnrollmentTrendPointDto, isArray: true })
  enrollmentTrend!: WardEnrollmentTrendPointDto[];

  @ApiProperty({ type: WardDetailFieldWorkerDto, isArray: true })
  fieldWorkers!: WardDetailFieldWorkerDto[];

  @ApiProperty({ type: WardDetailHealthFacilityDto, isArray: true })
  healthFacilities!: WardDetailHealthFacilityDto[];

  @ApiProperty({
    type: ActivityLogEntryDto,
    isArray: true,
    description:
      'Unified activity feed for Enrollment Activity and Activity Log tabs',
  })
  activityLog!: ActivityLogEntryDto[];
}

export class AssignWardFieldWorkersDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description:
      'Field worker user IDs to assign to this ward (replaces existing ward assignments)',
  })
  @IsArray()
  @IsUUID('7', { each: true })
  fieldWorkerIds!: string[];
}

export class AssignWardFieldWorkersResponseDto {
  @ApiProperty({ example: '3 field workers assigned to Vom Central' })
  message!: string;
}
