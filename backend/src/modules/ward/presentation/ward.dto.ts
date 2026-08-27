import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import { Transform } from 'class-transformer';
import {
  EmptyStringToUndefined,
  toQueryInt,
} from '../../../platform/http/query-transforms';

export class CreateWardDto {
  @ApiProperty({ example: 'Ward 1' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'Municipal LGA' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  lga!: string;
}

export class UpdateWardDto {
  @ApiPropertyOptional({ example: 'Ward 1A' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'Central LGA' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  lga?: string;
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

export class WardResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  lga!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
