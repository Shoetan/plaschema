import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
