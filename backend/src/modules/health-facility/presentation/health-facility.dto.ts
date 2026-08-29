import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
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
import {
  EmptyStringToUndefined,
  toQueryInt,
} from '../../../platform/http/query-transforms';
import {
  DEFAULT_HEALTH_FACILITY_LEVEL,
  DEFAULT_HEALTH_FACILITY_TYPE,
  HEALTH_FACILITY_LEVELS,
  HEALTH_FACILITY_STATUSES,
  type HealthFacilityLevel,
  type HealthFacilityStatus,
} from '../domain/health-facility';

export class CreateHealthFacilityDto {
  @ApiProperty({ example: 'Tudun Wada PHC' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(160)
  name!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('7')
  wardId!: string;

  @ApiPropertyOptional({
    example: 'Jos North',
    description: 'Optional; defaults to the selected ward LGA',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  lga?: string;

  @ApiPropertyOptional({
    example: DEFAULT_HEALTH_FACILITY_TYPE,
    default: DEFAULT_HEALTH_FACILITY_TYPE,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  type?: string;

  @ApiPropertyOptional({
    enum: HEALTH_FACILITY_LEVELS,
    default: DEFAULT_HEALTH_FACILITY_LEVEL,
  })
  @IsOptional()
  @IsEnum(HEALTH_FACILITY_LEVELS)
  level?: HealthFacilityLevel;

  @ApiPropertyOptional({ enum: HEALTH_FACILITY_STATUSES, default: 'active' })
  @IsOptional()
  @IsEnum(HEALTH_FACILITY_STATUSES)
  status?: HealthFacilityStatus;
}

export class UpdateHealthFacilityDto {
  @ApiPropertyOptional({ example: 'Tudun Wada PHC' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(160)
  name?: string;

  @ApiPropertyOptional({
    example: 'Jos North',
    description: 'Optional; when wardId changes, defaults to the new ward LGA',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  lga?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('7')
  wardId?: string;

  @ApiPropertyOptional({ example: DEFAULT_HEALTH_FACILITY_TYPE })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  type?: string;

  @ApiPropertyOptional({ enum: HEALTH_FACILITY_LEVELS })
  @IsOptional()
  @IsEnum(HEALTH_FACILITY_LEVELS)
  level?: HealthFacilityLevel;

  @ApiPropertyOptional({ enum: HEALTH_FACILITY_STATUSES })
  @IsOptional()
  @IsEnum(HEALTH_FACILITY_STATUSES)
  status?: HealthFacilityStatus;
}

export class ListHealthFacilitiesQueryDto {
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
    example: 'Jos North',
    description: 'Filter by ward LGA',
  })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  lga?: string;

  @ApiPropertyOptional({
    type: String,
    example: DEFAULT_HEALTH_FACILITY_TYPE,
  })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ enum: HEALTH_FACILITY_LEVELS })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsEnum(HEALTH_FACILITY_LEVELS)
  level?: HealthFacilityLevel;

  @ApiPropertyOptional({ enum: HEALTH_FACILITY_STATUSES })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsEnum(HEALTH_FACILITY_STATUSES)
  status?: HealthFacilityStatus;

  @ApiPropertyOptional({
    type: String,
    example: 'Tudun',
    description: 'Search by facility name, type, ward name, or LGA',
  })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  search?: string;
}

export class StreamHealthFacilitiesQueryDto {
  @ApiPropertyOptional({
    type: String,
    description:
      'Only stream facilities updated at or after this ISO datetime (incremental sync)',
  })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsDateString()
  updatedSince?: string;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsUUID('7')
  wardId?: string;
}

export class HealthFacilityWardDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Tudun Wada' })
  name!: string;

  @ApiProperty({ example: 'Jos North' })
  lga!: string;
}

export class HealthFacilityListItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Tudun Wada PHC' })
  name!: string;

  @ApiProperty({ example: DEFAULT_HEALTH_FACILITY_TYPE })
  type!: string;

  @ApiProperty({
    enum: HEALTH_FACILITY_LEVELS,
    example: DEFAULT_HEALTH_FACILITY_LEVEL,
  })
  level!: HealthFacilityLevel;

  @ApiProperty({ type: HealthFacilityWardDto })
  ward!: HealthFacilityWardDto;

  @ApiProperty({ example: 289 })
  beneficiaries!: number;

  @ApiProperty({ enum: HEALTH_FACILITY_STATUSES, example: 'active' })
  status!: HealthFacilityStatus;
}

export class HealthFacilityResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({
    description: 'LGA from the joined ward',
    example: 'Jos North',
  })
  lga!: string;

  @ApiProperty({ example: DEFAULT_HEALTH_FACILITY_TYPE })
  type!: string;

  @ApiProperty({ enum: HEALTH_FACILITY_LEVELS })
  level!: HealthFacilityLevel;

  @ApiProperty({ enum: HEALTH_FACILITY_STATUSES })
  status!: HealthFacilityStatus;

  @ApiProperty({ format: 'uuid' })
  wardId!: string;

  @ApiProperty({ type: HealthFacilityWardDto })
  ward!: HealthFacilityWardDto;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class HealthFacilityDetailFacilityDto extends HealthFacilityResponseDto {
  @ApiProperty({ example: 'Plateau' })
  state!: 'Plateau';
}

export class HealthFacilityDetailStatsDto {
  @ApiProperty({ example: 156 })
  totalBeneficiaries!: number;

  @ApiProperty({ example: 31 })
  enrollmentsThisMonth!: number;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: null,
    description: 'Stub until capitation billing is implemented',
  })
  currentCapitation!: number | null;

  @ApiProperty({ type: Date, nullable: true })
  lastActivityAt!: Date | null;
}

export class HealthFacilityCapitationStubDto {
  @ApiProperty({ example: false })
  implemented!: false;

  @ApiProperty({ type: Number, nullable: true, example: null })
  currentAmount!: number | null;

  @ApiProperty({ example: 'NGN' })
  currency!: 'NGN';

  @ApiProperty({ type: 'array', example: [] })
  records!: unknown[];
}

export class HealthFacilityDetailActivityLogActorDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;
}

export class HealthFacilityDetailActivityLogEntryDto {
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

  @ApiProperty({ nullable: true, type: HealthFacilityDetailActivityLogActorDto })
  actor!: HealthFacilityDetailActivityLogActorDto | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  enrollmentId!: string | null;

  @ApiProperty()
  occurredAt!: Date;
}

export class HealthFacilityDetailResponseDto {
  @ApiProperty({ type: HealthFacilityDetailFacilityDto })
  facility!: HealthFacilityDetailFacilityDto;

  @ApiProperty({ type: HealthFacilityDetailStatsDto })
  stats!: HealthFacilityDetailStatsDto;

  @ApiProperty({ type: HealthFacilityCapitationStubDto })
  capitation!: HealthFacilityCapitationStubDto;

  @ApiProperty({
    type: HealthFacilityDetailActivityLogEntryDto,
    isArray: true,
  })
  activityLog!: HealthFacilityDetailActivityLogEntryDto[];
}
