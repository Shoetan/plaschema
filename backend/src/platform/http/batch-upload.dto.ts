import { ApiProperty } from '@nestjs/swagger';

export class BatchUploadErrorDto {
  @ApiProperty({ example: 2 })
  row!: number;

  @ApiProperty({ example: 'name and lga are required' })
  message!: string;
}

export class BatchUploadResultDto {
  @ApiProperty({ example: 10 })
  created!: number;

  @ApiProperty({ example: 1 })
  failed!: number;

  @ApiProperty({ type: [BatchUploadErrorDto] })
  errors!: BatchUploadErrorDto[];
}
