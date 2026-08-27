import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../platform/auth/current-user.decorator';
import { Roles } from '../../../platform/auth/roles.decorator';
import { AppError } from '../../../platform/http/app-error';
import { UuidV7Pipe } from '../../../platform/http/uuid-v7.pipe';
import { CreateEnrollmentUseCase } from '../application/create-enrollment.use-case';
import { GetEnrollmentFileUseCase } from '../application/get-enrollment-file.use-case';
import { GetEnrollmentUseCase } from '../application/get-enrollment.use-case';
import { ListEnrollmentsUseCase } from '../application/list-enrollments.use-case';
import { UploadEnrollmentFileUseCase } from '../application/upload-enrollment-file.use-case';
import {
  CreateEnrollmentDto,
  EnrollmentResponseDto,
  EnrollmentUploadResponseDto,
  ListEnrollmentsQueryDto,
} from './enrollment.dto';

@ApiTags('enrollments')
@ApiBearerAuth('bearer')
@Controller('enrollments')
export class EnrollmentController {
  constructor(
    private readonly createEnrollment: CreateEnrollmentUseCase,
    private readonly uploadEnrollmentFile: UploadEnrollmentFileUseCase,
    private readonly listEnrollments: ListEnrollmentsUseCase,
    private readonly getEnrollment: GetEnrollmentUseCase,
    private readonly getEnrollmentFile: GetEnrollmentFileUseCase,
  ) {}

  @Post('files')
  @Roles('admin', 'field_worker')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'purpose'],
      properties: {
        purpose: {
          type: 'string',
          enum: ['passport', 'id_document'],
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Passport photo or ID document (JPEG/PNG/WebP/PDF)',
        },
      },
    },
  })
  @ApiOperation({
    summary:
      'Upload enrollment passport or ID document (local storage stub; later presigned URLs)',
  })
  @ApiOkResponse({ type: EnrollmentUploadResponseDto })
  uploadFile(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('purpose') purpose: 'passport' | 'id_document',
  ) {
    if (!file?.buffer) {
      throw new AppError('VALIDATION_ERROR', 'File is required', 400);
    }
    if (purpose !== 'passport' && purpose !== 'id_document') {
      throw new AppError(
        'VALIDATION_ERROR',
        'purpose must be passport or id_document',
        400,
      );
    }

    return this.uploadEnrollmentFile.execute({
      purpose,
      originalFilename: file.originalname,
      contentType: file.mimetype,
      buffer: file.buffer,
    });
  }

  @Get('files')
  @Roles('admin', 'field_worker')
  @ApiOperation({
    summary: 'Download a previously uploaded enrollment file (local stub)',
  })
  @ApiQuery({
    name: 'objectKey',
    required: true,
    description: 'Object key returned by the upload endpoint',
  })
  async downloadFile(@Query('objectKey') objectKey?: string) {
    if (!objectKey?.trim()) {
      throw new AppError('VALIDATION_ERROR', 'objectKey is required', 400);
    }

    const file = await this.getEnrollmentFile.execute(objectKey);
    return new StreamableFile(file.buffer, {
      type: file.contentType,
      disposition: `inline; filename="${file.objectKey.split('/').pop()}"`,
    });
  }

  @Post()
  @Roles('admin', 'field_worker')
  @ApiOperation({
    summary:
      'Create enrollment (idempotent via idempotencyId; duplicate identity = first+last+DOB)',
  })
  @ApiCreatedResponse({
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Enrollment submitted successfully',
        },
      },
    },
  })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateEnrollmentDto,
  ) {
    await this.createEnrollment.execute(user, body);
    return { message: 'Enrollment submitted successfully' };
  }

  @Get()
  @Roles('admin', 'field_worker')
  @ApiOperation({ summary: 'List enrollments' })
  @ApiOkResponse({ type: EnrollmentResponseDto, isArray: true })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListEnrollmentsQueryDto,
  ) {
    const result = await this.listEnrollments.execute(user, query);
    return {
      data: result.items,
      meta: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
      },
    };
  }

  @Get(':id')
  @Roles('admin', 'field_worker')
  @ApiOperation({ summary: 'Get enrollment by id' })
  @ApiOkResponse({ type: EnrollmentResponseDto })
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', UuidV7Pipe) id: string,
  ) {
    return this.getEnrollment.execute(user, id);
  }
}
