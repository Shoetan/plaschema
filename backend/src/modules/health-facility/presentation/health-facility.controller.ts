import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Readable } from 'node:stream';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../platform/auth/roles.decorator';
import { BatchUploadResultDto } from '../../../platform/http/batch-upload.dto';
import { assertSupportedBatchUpload } from '../../../platform/http/csv';
import { CursorPaginationMetaDto } from '../../../platform/http/cursor-pagination.dto';
import { UuidV7Pipe } from '../../../platform/http/uuid-v7.pipe';
import { BatchCreateHealthFacilitiesUseCase } from '../application/batch-create-health-facilities.use-case';
import { CreateHealthFacilityUseCase } from '../application/create-health-facility.use-case';
import { DeleteHealthFacilityUseCase } from '../application/delete-health-facility.use-case';
import { GetHealthFacilityUseCase } from '../application/get-health-facility.use-case';
import { ListHealthFacilitiesUseCase } from '../application/list-health-facilities.use-case';
import { StreamHealthFacilitiesUseCase } from '../application/stream-health-facilities.use-case';
import { UpdateHealthFacilityUseCase } from '../application/update-health-facility.use-case';
import {
  CreateHealthFacilityDto,
  HealthFacilityListItemDto,
  HealthFacilityResponseDto,
  ListHealthFacilitiesQueryDto,
  StreamHealthFacilitiesQueryDto,
  UpdateHealthFacilityDto,
} from './health-facility.dto';

@ApiTags('health-facilities')
@ApiBearerAuth('bearer')
@Controller('health-facilities')
export class HealthFacilityController {
  constructor(
    private readonly createFacility: CreateHealthFacilityUseCase,
    private readonly batchCreateFacilities: BatchCreateHealthFacilitiesUseCase,
    private readonly listFacilities: ListHealthFacilitiesUseCase,
    private readonly streamFacilities: StreamHealthFacilitiesUseCase,
    private readonly getFacility: GetHealthFacilityUseCase,
    private readonly updateFacility: UpdateHealthFacilityUseCase,
    private readonly deleteFacility: DeleteHealthFacilityUseCase,
  ) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a health facility' })
  @ApiCreatedResponse({ type: HealthFacilityResponseDto })
  create(@Body() body: CreateHealthFacilityDto) {
    return this.createFacility.execute(body);
  }

  @Post('batch')
  @Roles('admin')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'CSV or Excel (.xlsx/.xls) with columns: name,ward (lga optional/ignored; taken from ward)',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Batch create health facilities from CSV or Excel',
  })
  @ApiOkResponse({ type: BatchUploadResultDto })
  batchCreate(@UploadedFile() file?: Express.Multer.File) {
    const upload = assertSupportedBatchUpload(file);
    return this.batchCreateFacilities.execute(
      upload.buffer,
      upload.originalname,
    );
  }

  @Get()
  @Roles('admin', 'field_worker')
  @ApiOperation({ summary: 'List health facilities (cursor pagination)' })
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
  @ApiQuery({ name: 'lga', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({
    name: 'level',
    required: false,
    enum: ['primary', 'secondary', 'tertiary'],
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive'],
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by facility name, type, ward name, or LGA',
  })
  @ApiOkResponse({ type: HealthFacilityListItemDto, isArray: true })
  async list(@Query() query: ListHealthFacilitiesQueryDto) {
    const result = await this.listFacilities.execute(query);
    return {
      data: result.items,
      meta: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
        limit: result.limit,
      } satisfies CursorPaginationMetaDto,
    };
  }

  @Get('stream')
  @Roles('admin', 'field_worker')
  @Header('Content-Type', 'application/x-ndjson; charset=utf-8')
  @Header('Cache-Control', 'no-store')
  @ApiProduces('application/x-ndjson')
  @ApiOperation({
    summary:
      'Stream all health facilities as NDJSON for offline/mobile cache sync (one JSON object per line)',
  })
  stream(@Query() query: StreamHealthFacilitiesQueryDto): StreamableFile {
    const batches = this.streamFacilities.execute(query);
    const readable = Readable.from(iterateNdjson(batches));
    return new StreamableFile(readable, {
      type: 'application/x-ndjson; charset=utf-8',
      disposition: 'inline',
    });
  }

  @Get(':id')
  @Roles('admin', 'field_worker')
  @ApiOperation({ summary: 'Get a health facility by id' })
  @ApiOkResponse({ type: HealthFacilityResponseDto })
  get(@Param('id', UuidV7Pipe) id: string) {
    return this.getFacility.execute(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a health facility' })
  @ApiOkResponse({ type: HealthFacilityResponseDto })
  update(
    @Param('id', UuidV7Pipe) id: string,
    @Body() body: UpdateHealthFacilityDto,
  ) {
    return this.updateFacility.execute(id, body);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a health facility' })
  @ApiOkResponse({ description: 'Health facility deleted' })
  async remove(@Param('id', UuidV7Pipe) id: string) {
    await this.deleteFacility.execute(id);
    return { id, deleted: true };
  }
}

async function* iterateNdjson(
  batches: AsyncGenerator<object[], void, unknown>,
): AsyncGenerator<Buffer, void, unknown> {
  for await (const batch of batches) {
    for (const item of batch) {
      yield Buffer.from(`${JSON.stringify(item)}\n`, 'utf8');
    }
  }
}
