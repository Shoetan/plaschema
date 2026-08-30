import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
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
import { CursorPaginationMetaDto } from '../../../platform/http/cursor-pagination.dto';

export class CapitationPeriodQueryDto {
  @ApiProperty({ example: 8, minimum: 1, maximum: 12 })
  @Transform(({ value }) => toQueryInt(value, 0, { min: 1, max: 12 }))
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @ApiProperty({ example: 2026, minimum: 2000, maximum: 2100 })
  @Transform(({ value }) => toQueryInt(value, 0, { min: 2000, max: 2100 }))
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @ApiPropertyOptional({
    example: 700,
    description: 'Override default CAPITATION_RATE from server config',
  })
  @Transform(({ value }) =>
    value === undefined || value === '' ? undefined : toQueryInt(value, 0, { min: 1 }),
  )
  @IsOptional()
  @IsInt()
  @Min(1)
  rate?: number;
}

export class GenerateCapitationDto {
  @ApiProperty({ example: 8, minimum: 1, maximum: 12 })
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @ApiProperty({ example: 2026, minimum: 2000, maximum: 2100 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @ApiPropertyOptional({
    example: 700,
    description: 'Override default CAPITATION_RATE from server config',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  rate?: number;
}

export class ListCapitationsQueryDto {
  @ApiPropertyOptional({
    example: 8,
    minimum: 1,
    maximum: 12,
    description: 'Defaults to current month in Africa/Lagos',
  })
  @Transform(({ value }) =>
    value === undefined || value === '' ? undefined : toQueryInt(value, 0, { min: 1, max: 12 }),
  )
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({
    example: 2026,
    minimum: 2000,
    maximum: 2100,
    description: 'Defaults to current year in Africa/Lagos',
  })
  @Transform(({ value }) =>
    value === undefined || value === ''
      ? undefined
      : toQueryInt(value, 0, { min: 2000, max: 2100 }),
  )
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

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

  @ApiPropertyOptional({ example: 'Jos North' })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  lga?: string;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsUUID('7')
  healthFacilityId?: string;

  @ApiPropertyOptional({ description: 'Search facility name or LGA' })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}

export class CapitationRecordDraftDto {
  @ApiProperty({ format: 'uuid' })
  healthFacilityId!: string;

  @ApiProperty()
  facilityName!: string;

  @ApiProperty()
  lga!: string;

  @ApiProperty()
  beneficiaryCount!: number;

  @ApiProperty()
  rate!: number;

  @ApiProperty()
  amount!: number;
}

export class CapitationPreviewResponseDto {
  @ApiProperty()
  month!: number;

  @ApiProperty()
  year!: number;

  @ApiProperty()
  rate!: number;

  @ApiProperty()
  totalFacilities!: number;

  @ApiProperty()
  totalBeneficiaries!: number;

  @ApiProperty()
  totalCapitation!: number;

  @ApiProperty({ type: [CapitationRecordDraftDto] })
  records!: CapitationRecordDraftDto[];
}

export class CapitationGenerateResponseDto {
  @ApiProperty({ format: 'uuid' })
  runId!: string;

  @ApiProperty()
  month!: number;

  @ApiProperty()
  year!: number;

  @ApiProperty()
  rate!: number;

  @ApiProperty()
  generatedAt!: Date;

  @ApiProperty()
  totalFacilities!: number;

  @ApiProperty()
  totalBeneficiaries!: number;

  @ApiProperty()
  totalCapitation!: number;

  @ApiProperty()
  recordCount!: number;
}

export class CapitationRecordListItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  healthFacilityId!: string;

  @ApiProperty()
  facilityName!: string;

  @ApiProperty()
  lga!: string;

  @ApiProperty()
  month!: number;

  @ApiProperty()
  year!: number;

  @ApiProperty({ example: 'August 2026' })
  period!: string;

  @ApiProperty()
  beneficiaryCount!: number;

  @ApiProperty()
  rate!: number;

  @ApiProperty()
  amount!: number;
}

export class CapitationListSummaryDto {
  @ApiProperty({ format: 'uuid' })
  runId!: string;

  @ApiProperty()
  month!: number;

  @ApiProperty()
  year!: number;

  @ApiProperty()
  rate!: number;

  @ApiProperty()
  generatedAt!: Date;

  @ApiProperty()
  totalFacilities!: number;

  @ApiProperty()
  totalBeneficiaries!: number;

  @ApiProperty()
  totalCapitation!: number;
}

export class ListCapitationsResponseDto {
  @ApiProperty({ type: [CapitationRecordListItemDto] })
  data!: CapitationRecordListItemDto[];

  @ApiProperty({ type: CursorPaginationMetaDto })
  meta!: CursorPaginationMetaDto;

  @ApiProperty({ type: CapitationListSummaryDto, nullable: true })
  summary!: CapitationListSummaryDto | null;
}
