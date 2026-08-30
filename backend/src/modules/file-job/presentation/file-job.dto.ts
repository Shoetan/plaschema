import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { EmptyStringToUndefined, toQueryInt } from '../../../platform/http/query-transforms';
import { CursorPaginationMetaDto } from '../../../platform/http/cursor-pagination.dto';
import {
  FILE_JOB_FORMATS,
  FILE_JOB_KINDS,
  FILE_JOB_STATUSES,
  type FileJobFormat,
  type FileJobKind,
  type FileJobMetadata,
  type FileJobStatus,
} from '../domain/file-job';

export class ListFileJobsQueryDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Opaque cursor from meta.nextCursor',
  })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
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

  @ApiPropertyOptional({ enum: FILE_JOB_STATUSES })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsEnum(FILE_JOB_STATUSES)
  status?: FileJobStatus;
}

export class FileJobMetadataDto implements FileJobMetadata {
  @ApiPropertyOptional()
  enrollmentCount?: number;

  @ApiPropertyOptional()
  rowCount?: number;

  @ApiPropertyOptional({ type: [String] })
  enrollmentIds?: string[];
}

export class FileJobListItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: FILE_JOB_KINDS })
  kind!: FileJobKind;

  @ApiProperty({ enum: FILE_JOB_FORMATS })
  format!: FileJobFormat;

  @ApiProperty({
    example: 'Enrollment Report (xlsx) — 30-08-2026 11:26',
  })
  title!: string;

  @ApiProperty({ enum: FILE_JOB_STATUSES })
  status!: FileJobStatus;

  @ApiPropertyOptional({ type: FileJobMetadataDto, nullable: true })
  metadata!: FileJobMetadataDto | null;

  @ApiPropertyOptional({ nullable: true })
  error!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional({ nullable: true })
  startedAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  completedAt!: Date | null;

  @ApiProperty()
  canDownload!: boolean;
}

export class ListFileJobsResponseDto {
  @ApiProperty({ type: [FileJobListItemDto] })
  data!: FileJobListItemDto[];

  @ApiProperty({ type: CursorPaginationMetaDto })
  meta!: CursorPaginationMetaDto;
}

export class FileJobDetailDto extends FileJobListItemDto {}

export class FileJobDownloadResponseDto {
  @ApiProperty({ format: 'uuid' })
  jobId!: string;

  @ApiProperty()
  downloadUrl!: string;

  @ApiProperty({ example: 1800 })
  expiresInSeconds!: number;

  @ApiProperty()
  title!: string;

  @ApiProperty({
    example: 'Enrollment Report (xlsx) — 30-08-2026 11:26.xlsx',
    description: 'Suggested filename for the downloaded file',
  })
  filename!: string;

  @ApiProperty({ enum: FILE_JOB_FORMATS })
  format!: FileJobFormat;
}
