import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiAcceptedResponse,
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
import { CursorPaginationMetaDto } from '../../../platform/http/cursor-pagination.dto';
import { UuidV7Pipe } from '../../../platform/http/uuid-v7.pipe';
import { CreateEnrollmentUseCase } from '../application/create-enrollment.use-case';
import { DevUploadEnrollmentFileUseCase } from '../application/dev-upload-enrollment-file.use-case';
import { GenerateIdCardsUseCase } from '../application/generate-id-cards.use-case';
import { GetEnrollmentUseCase } from '../application/get-enrollment.use-case';
import { GetIdCardJobStatusUseCase } from '../application/get-id-card-job-status.use-case';
import { ListEnrollmentsUseCase } from '../application/list-enrollments.use-case';
import { PresignEnrollmentUploadUseCase } from '../application/presign-enrollment-upload.use-case';
import {
  CreateEnrollmentDto,
  EnrollmentDevUploadResponseDto,
  EnrollmentListItemDto,
  EnrollmentPresignUploadRequestDto,
  EnrollmentPresignUploadResponseDto,
  EnrollmentResponseDto,
  GenerateIdCardsRequestDto,
  GenerateIdCardsResponseDto,
  IdCardJobStatusResponseDto,
  ListEnrollmentsQueryDto,
} from './enrollment.dto';

@ApiTags('enrollments')
@ApiBearerAuth('bearer')
@Controller('enrollments')
export class EnrollmentController {
  constructor(
    private readonly createEnrollment: CreateEnrollmentUseCase,
    private readonly presignEnrollmentUpload: PresignEnrollmentUploadUseCase,
    private readonly devUploadEnrollmentFile: DevUploadEnrollmentFileUseCase,
    private readonly listEnrollments: ListEnrollmentsUseCase,
    private readonly getEnrollment: GetEnrollmentUseCase,
    private readonly generateIdCards: GenerateIdCardsUseCase,
    private readonly getIdCardJobStatus: GetIdCardJobStatusUseCase,
  ) {}

  @Post('files/presign-upload')
  @Roles('admin', 'field_worker')
  @ApiOperation({
    summary:
      'Get a Railway presigned PUT URL to upload a passport or ID document',
  })
  @ApiOkResponse({ type: EnrollmentPresignUploadResponseDto })
  presignUpload(@Body() body: EnrollmentPresignUploadRequestDto) {
    return this.presignEnrollmentUpload.execute({
      purpose: body.purpose,
      originalFilename: body.filename,
      contentType: body.contentType,
    });
  }

  @Post('files/dev-upload')
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
      '[DEV/TEST ONLY] Upload file via backend (presign + PUT to Railway). Disabled in production.',
  })
  @ApiOkResponse({ type: EnrollmentDevUploadResponseDto })
  async devUpload(
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

    return this.devUploadEnrollmentFile.execute({
      purpose,
      originalFilename: file.originalname,
      contentType: file.mimetype,
      buffer: file.buffer,
    });
  }

  @Post('id-cards/generate')
  @Roles('admin')
  @HttpCode(202)
  @ApiOperation({
    summary:
      'Enqueue async ID card PDF generation (1–9 enrollments, 9-up A4 front+back). Non-blocking.',
  })
  @ApiAcceptedResponse({ type: GenerateIdCardsResponseDto })
  generateCards(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: GenerateIdCardsRequestDto,
  ) {
    return this.generateIdCards.execute({
      enrollmentIds: body.enrollmentIds,
      requestedByUserId: user.id,
    });
  }

  @Get('id-cards/jobs/:jobId')
  @Roles('admin')
  @ApiOperation({ summary: 'Poll ID card generation job status / download URL' })
  @ApiOkResponse({ type: IdCardJobStatusResponseDto })
  getCardJob(@Param('jobId') jobId: string) {
    return this.getIdCardJobStatus.execute(jobId);
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
  @ApiOperation({
    summary:
      'List enrollments (cursor pagination). Supports ID-card page filters in one endpoint.',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: String,
    description: 'Opaque cursor from meta.nextCursor',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 50,
    description: 'Page size (1-100)',
  })
  @ApiQuery({ name: 'wardId', required: false, type: String })
  @ApiQuery({ name: 'healthFacilityId', required: false, type: String })
  @ApiQuery({ name: 'enrolledByMe', required: false, type: Boolean })
  @ApiQuery({
    name: 'enrolledByUserId',
    required: false,
    type: String,
    description: 'Admin only: filter by field worker user id',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'active', 'disabled', 'deceased'],
  })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({
    name: 'printedStatus',
    required: false,
    enum: ['all', 'printed', 'not_printed'],
  })
  @ApiQuery({ name: 'lga', required: false, type: String })
  @ApiQuery({ name: 'beneficiaryName', required: false, type: String })
  @ApiQuery({ name: 'enrollmentId', required: false, type: String })
  @ApiQuery({ name: 'createdFrom', required: false, type: String })
  @ApiQuery({ name: 'createdTo', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiOkResponse({ type: EnrollmentListItemDto, isArray: true })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListEnrollmentsQueryDto,
  ) {
    const result = await this.listEnrollments.execute(user, query);
    return {
      data: result.items,
      meta: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
        limit: result.limit,
      } satisfies CursorPaginationMetaDto,
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
