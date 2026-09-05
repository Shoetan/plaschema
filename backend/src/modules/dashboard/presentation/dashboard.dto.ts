import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { EmptyStringToUndefined } from '../../../platform/http/query-transforms';
import {
  DASHBOARD_PERIODS,
  DASHBOARD_TREND_GRANULARITIES,
  type DashboardPeriod,
  type DashboardTrendGranularity,
} from '../domain/dashboard-period';

export class DashboardQueryDto {
  @ApiPropertyOptional({
    example: 'Jos South',
    description: 'Filter by LGA name. Omit for all LGAs.',
  })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lga?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    description: 'Filter by ward UUID. Must belong to lga when both are set.',
  })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsUUID('7')
  wardId?: string;

  @ApiPropertyOptional({
    enum: DASHBOARD_PERIODS,
    default: '30d',
    description: 'Africa/Lagos rolling window ending now',
  })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsEnum(DASHBOARD_PERIODS)
  period?: DashboardPeriod = '30d';

  @ApiPropertyOptional({
    enum: DASHBOARD_TREND_GRANULARITIES,
    default: 'monthly',
    description: 'Enrollment trend bar granularity',
  })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsEnum(DASHBOARD_TREND_GRANULARITIES)
  trend?: DashboardTrendGranularity = 'monthly';
}

export class DashboardFiltersDto {
  @ApiProperty({ nullable: true, example: 'Jos South' })
  lga!: string | null;

  @ApiProperty({ nullable: true, format: 'uuid' })
  wardId!: string | null;

  @ApiProperty({ enum: DASHBOARD_PERIODS })
  period!: DashboardPeriod;

  @ApiProperty({ enum: DASHBOARD_TREND_GRANULARITIES })
  trend!: DashboardTrendGranularity;

  @ApiProperty()
  periodStart!: Date;

  @ApiProperty()
  periodEnd!: Date;
}

export class KpiPercentChangeDto {
  @ApiProperty({ example: 2299 })
  value!: number;

  @ApiProperty({ example: 8.5 })
  changePercent!: number;
}

export class KpiAbsoluteChangeDto {
  @ApiProperty({ example: 8 })
  value!: number;

  @ApiProperty({ example: 3 })
  changeAbsolute!: number;
}

export class DashboardKpisDto {
  @ApiProperty({ type: KpiPercentChangeDto })
  totalEnrollments!: KpiPercentChangeDto;

  @ApiProperty({ type: KpiPercentChangeDto })
  activeBeneficiaries!: KpiPercentChangeDto;

  @ApiProperty({ type: KpiPercentChangeDto })
  inactiveBeneficiaries!: KpiPercentChangeDto;

  @ApiProperty({ type: KpiPercentChangeDto })
  newEnrollments!: KpiPercentChangeDto;

  @ApiProperty({ type: KpiAbsoluteChangeDto })
  totalFacilities!: KpiAbsoluteChangeDto;

  @ApiProperty({ type: KpiAbsoluteChangeDto })
  fieldWorkers!: KpiAbsoluteChangeDto;
}

export class DashboardTrendPointDto {
  @ApiProperty({ example: '2026-08' })
  key!: string;

  @ApiProperty({ example: 'Aug' })
  label!: string;

  @ApiProperty({ example: 712 })
  count!: number;
}

export class DashboardEnrollmentTrendDto {
  @ApiProperty({ example: 2299 })
  total!: number;

  @ApiProperty({ example: 287.4 })
  average!: number;

  @ApiProperty({ enum: DASHBOARD_TREND_GRANULARITIES })
  granularity!: DashboardTrendGranularity;

  @ApiProperty({ type: DashboardTrendPointDto, isArray: true })
  points!: DashboardTrendPointDto[];
}

export class DashboardIdNameDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;
}

export class DashboardActivityItemDto {
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

  @ApiProperty({ type: DashboardIdNameDto })
  ward!: DashboardIdNameDto;

  @ApiProperty({ type: DashboardIdNameDto, nullable: true })
  actor!: DashboardIdNameDto | null;

  @ApiProperty()
  occurredAt!: Date;
}

export class DashboardCategoryCountDto {
  @ApiProperty({ example: 'IDPs' })
  category!: string;

  @ApiProperty({ example: 120 })
  count!: number;
}

export class DashboardStatusSliceDto {
  @ApiProperty({ example: 2044 })
  count!: number;

  @ApiProperty({ example: 89 })
  percent!: number;
}

export class DashboardEnrollmentByStatusDto {
  @ApiProperty({ type: DashboardStatusSliceDto })
  active!: DashboardStatusSliceDto;

  @ApiProperty({
    type: DashboardStatusSliceDto,
    description: 'Maps to enrollment status disabled',
  })
  inactive!: DashboardStatusSliceDto;
}

export class DashboardWardEnrollmentDto {
  @ApiProperty({ format: 'uuid' })
  wardId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ example: 534 })
  count!: number;
}

export class DashboardLgaEnrollmentDto {
  @ApiProperty({ example: 'Pankshin' })
  lga!: string;

  @ApiProperty({ example: 534 })
  count!: number;
}

export class DashboardFacilityItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  lga!: string;

  @ApiProperty({ type: DashboardIdNameDto })
  ward!: DashboardIdNameDto;

  @ApiProperty({ example: 412 })
  beneficiaries!: number;
}

export class DashboardFacilityOverviewDto {
  @ApiProperty({ example: 10 })
  totalFacilities!: number;

  @ApiProperty({ example: 9 })
  activeFacilities!: number;

  @ApiProperty({ example: 1913 })
  totalBeneficiaries!: number;

  @ApiProperty({
    type: DashboardFacilityItemDto,
    isArray: true,
    description: 'Top 5 facilities by period enrollments',
  })
  items!: DashboardFacilityItemDto[];
}

export class DashboardFieldWorkerItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ example: 201 })
  enrolled!: number;

  @ApiProperty({ nullable: true })
  lastActivityAt!: Date | null;

  @ApiProperty({ enum: ['active', 'inactive'] })
  status!: 'active' | 'inactive';
}

export class DashboardFieldWorkerPerformanceDto {
  @ApiProperty({ example: 8 })
  totalFieldWorkers!: number;

  @ApiProperty({ example: 7 })
  activeFieldWorkers!: number;

  @ApiProperty({ example: 1012 })
  totalEnrolled!: number;

  @ApiProperty({ example: 127 })
  averagePerWorker!: number;

  @ApiProperty({
    type: DashboardFieldWorkerItemDto,
    isArray: true,
    description: 'Top 10 field workers by period enrollments',
  })
  items!: DashboardFieldWorkerItemDto[];
}

export class DashboardRecentEnrollmentDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'PL/CBHI/2026/001' })
  enrollmentId!: string;

  @ApiProperty()
  beneficiaryName!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty({ enum: ['pending', 'active', 'disabled', 'deceased'] })
  status!: string;

  @ApiProperty()
  lga!: string;

  @ApiProperty({ type: DashboardIdNameDto })
  ward!: DashboardIdNameDto;

  @ApiProperty({ type: DashboardIdNameDto })
  facility!: DashboardIdNameDto;

  @ApiProperty()
  createdAt!: Date;
}

export class DashboardResponseDto {
  @ApiProperty({ type: DashboardFiltersDto })
  filters!: DashboardFiltersDto;

  @ApiProperty({ type: DashboardKpisDto })
  kpis!: DashboardKpisDto;

  @ApiProperty({ type: DashboardEnrollmentTrendDto })
  enrollmentTrend!: DashboardEnrollmentTrendDto;

  @ApiProperty({
    type: DashboardActivityItemDto,
    isArray: true,
    description: 'Latest 10 activity log entries in the period',
  })
  recentActivity!: DashboardActivityItemDto[];

  @ApiProperty({ type: DashboardCategoryCountDto, isArray: true })
  enrollmentByCategory!: DashboardCategoryCountDto[];

  @ApiProperty({ type: DashboardEnrollmentByStatusDto })
  enrollmentByStatus!: DashboardEnrollmentByStatusDto;

  @ApiProperty({
    type: DashboardWardEnrollmentDto,
    isArray: true,
    description: 'Top 10 wards by period enrollments',
  })
  enrollmentByWard!: DashboardWardEnrollmentDto[];

  @ApiProperty({
    type: DashboardLgaEnrollmentDto,
    isArray: true,
    description: 'All LGAs with period enrollments, descending',
  })
  enrollmentByLga!: DashboardLgaEnrollmentDto[];

  @ApiProperty({ type: DashboardFacilityOverviewDto })
  facilityOverview!: DashboardFacilityOverviewDto;

  @ApiProperty({ type: DashboardFieldWorkerPerformanceDto })
  fieldWorkerPerformance!: DashboardFieldWorkerPerformanceDto;

  @ApiProperty({
    type: DashboardRecentEnrollmentDto,
    isArray: true,
    description: 'Latest 5 enrollments in the period',
  })
  recentEnrollments!: DashboardRecentEnrollmentDto[];
}
