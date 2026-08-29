import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Put,
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
import { CurrentUser } from '../../../platform/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../../platform/auth/current-user.decorator';
import { BatchUploadResultDto } from '../../../platform/http/batch-upload.dto';
import { assertSupportedBatchUpload } from '../../../platform/http/csv';
import { CursorPaginationMetaDto } from '../../../platform/http/cursor-pagination.dto';
import { UuidV7Pipe } from '../../../platform/http/uuid-v7.pipe';
import { AssignWardFieldWorkersUseCase } from '../application/assign-ward-field-workers.use-case';
import { BatchCreateWardsUseCase } from '../application/batch-create-wards.use-case';
import { CreateWardUseCase } from '../application/create-ward.use-case';
import { DeleteWardUseCase } from '../application/delete-ward.use-case';
import { GetWardDetailUseCase } from '../application/get-ward-detail.use-case';
import { GetWardUseCase } from '../application/get-ward.use-case';
import { ListWardsUseCase } from '../application/list-wards.use-case';
import { StreamWardsUseCase } from '../application/stream-wards.use-case';
import { UpdateWardUseCase } from '../application/update-ward.use-case';
import {
  CreateWardDto,
  AssignWardFieldWorkersDto,
  AssignWardFieldWorkersResponseDto,
  ListWardsQueryDto,
  StreamWardsQueryDto,
  UpdateWardDto,
  WardListItemDto,
  WardDetailResponseDto,
  WardResponseDto,
} from './ward.dto';
import { WARD_STATE, type Ward } from '../domain/ward';

function withWardState(ward: Ward) {
  return { ...ward, state: WARD_STATE };
}

@ApiTags('wards')
@ApiBearerAuth('bearer')
@Controller('wards')
export class WardController {
  constructor(
    private readonly createWard: CreateWardUseCase,
    private readonly batchCreateWards: BatchCreateWardsUseCase,
    private readonly listWards: ListWardsUseCase,
    private readonly streamWards: StreamWardsUseCase,
    private readonly getWard: GetWardUseCase,
    private readonly getWardDetail: GetWardDetailUseCase,
    private readonly assignWardFieldWorkers: AssignWardFieldWorkersUseCase,
    private readonly updateWard: UpdateWardUseCase,
    private readonly deleteWard: DeleteWardUseCase,
  ) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a ward' })
  @ApiCreatedResponse({ type: WardResponseDto })
  async create(@Body() body: CreateWardDto) {
    return withWardState(await this.createWard.execute(body));
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
          description: 'CSV or Excel (.xlsx/.xls) with columns: name,lga',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Batch create wards from CSV or Excel' })
  @ApiOkResponse({ type: BatchUploadResultDto })
  batchCreate(@UploadedFile() file?: Express.Multer.File) {
    const upload = assertSupportedBatchUpload(file);
    return this.batchCreateWards.execute(upload.buffer, upload.originalname);
  }

  @Get()
  @Roles('admin', 'field_worker')
  @ApiOperation({ summary: 'List wards (cursor pagination)' })
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
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by ward name or LGA',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive'],
  })
  @ApiOkResponse({ type: WardListItemDto, isArray: true })
  async list(@Query() query: ListWardsQueryDto) {
    const result = await this.listWards.execute(query);
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
      'Stream all wards as NDJSON for offline/mobile cache sync (one JSON object per line)',
  })
  stream(@Query() query: StreamWardsQueryDto): StreamableFile {
    const batches = this.streamWards.execute(query);
    const readable = Readable.from(iterateNdjson(batches));
    return new StreamableFile(readable, {
      type: 'application/x-ndjson; charset=utf-8',
      disposition: 'inline',
    });
  }

  @Get(':id/detail')
  @Roles('admin')
  @ApiOperation({ summary: 'Get ward detail (admin overview, tabs, activity log)' })
  @ApiOkResponse({ type: WardDetailResponseDto })
  detail(@Param('id', UuidV7Pipe) id: string) {
    return this.getWardDetail.execute(id);
  }

  @Put(':id/field-workers')
  @Roles('admin')
  @ApiOperation({
    summary:
      'Assign field workers to a ward (multiselect; replaces existing assignments for this ward)',
  })
  @ApiOkResponse({ type: AssignWardFieldWorkersResponseDto })
  assignFieldWorkers(
    @Param('id', UuidV7Pipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: AssignWardFieldWorkersDto,
  ) {
    return this.assignWardFieldWorkers.execute(user, id, body.fieldWorkerIds);
  }

  @Get(':id')
  @Roles('admin', 'field_worker')
  @ApiOperation({ summary: 'Get a ward by id' })
  @ApiOkResponse({ type: WardResponseDto })
  async get(@Param('id', UuidV7Pipe) id: string) {
    return withWardState(await this.getWard.execute(id));
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a ward' })
  @ApiOkResponse({ type: WardResponseDto })
  async update(@Param('id', UuidV7Pipe) id: string, @Body() body: UpdateWardDto) {
    return withWardState(await this.updateWard.execute(id, body));
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a ward' })
  @ApiOkResponse({ description: 'Ward deleted' })
  async remove(@Param('id', UuidV7Pipe) id: string) {
    await this.deleteWard.execute(id);
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
