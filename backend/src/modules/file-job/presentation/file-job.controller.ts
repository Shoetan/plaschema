import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../platform/auth/current-user.decorator';
import { Roles } from '../../../platform/auth/roles.decorator';
import { AppError } from '../../../platform/http/app-error';
import { UuidV7Pipe } from '../../../platform/http/uuid-v7.pipe';
import { GetFileJobDownloadUrlUseCase } from '../application/get-file-job-download-url.use-case';
import {
  GetFileJobUseCase,
  ListFileJobsUseCase,
} from '../application/list-file-jobs.use-case';
import {
  FileJobDetailDto,
  FileJobDownloadResponseDto,
  ListFileJobsQueryDto,
  ListFileJobsResponseDto,
} from './file-job.dto';

@ApiTags('file-jobs')
@ApiBearerAuth('bearer')
@Controller('file-jobs')
export class FileJobController {
  constructor(
    private readonly listFileJobs: ListFileJobsUseCase,
    private readonly getFileJob: GetFileJobUseCase,
    private readonly getFileJobDownloadUrl: GetFileJobDownloadUrlUseCase,
  ) {}

  @Get()
  @Roles('admin')
  @ApiOperation({
    summary:
      'List file generation jobs for the current user (active jobs first, then newest)',
  })
  @ApiOkResponse({ type: ListFileJobsResponseDto })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListFileJobsQueryDto,
  ) {
    const result = await this.listFileJobs.execute(user, query);
    return {
      data: result.items,
      meta: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
        limit: result.limit,
      },
    };
  }

  @Get(':id/download')
  @Roles('admin')
  @ApiOperation({
    summary: 'Get a fresh presigned download URL for a completed file job',
  })
  @ApiOkResponse({ type: FileJobDownloadResponseDto })
  async download(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', UuidV7Pipe) id: string,
  ) {
    return this.getFileJobDownloadUrl.execute(user, id);
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get a file job by id (current user only)' })
  @ApiOkResponse({ type: FileJobDetailDto })
  @ApiNotFoundResponse()
  async get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', UuidV7Pipe) id: string,
  ) {
    const job = await this.getFileJob.execute(user, id);
    if (!job) {
      throw new AppError('FILE_JOB_NOT_FOUND', 'File job not found', 404);
    }
    return job;
  }
}
