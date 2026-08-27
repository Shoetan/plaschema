import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
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

export class CreateHealthFacilityDto {
  @ApiProperty({ example: 'Central Clinic' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(160)
  name!: string;

  @ApiProperty({ example: 'Municipal LGA' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  lga!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('7')
  wardId!: string;
}

export class UpdateHealthFacilityDto {
  @ApiPropertyOptional({ example: 'Central Clinic' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(160)
  name?: string;

  @ApiPropertyOptional({ example: 'Municipal LGA' })
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

  @ApiPropertyOptional({ type: String, example: 'Municipal LGA' })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  lga?: string;
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

  @ApiProperty()
  name!: string;

  @ApiProperty()
  lga!: string;
}

export class HealthFacilityResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  lga!: string;

  @ApiProperty({ format: 'uuid' })
  wardId!: string;

  @ApiProperty({ type: HealthFacilityWardDto })
  ward!: HealthFacilityWardDto;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
