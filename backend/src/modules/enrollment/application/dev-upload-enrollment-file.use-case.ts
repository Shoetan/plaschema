import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../../platform/config/app-config.service';
import { AppError } from '../../../platform/http/app-error';
import {
  PresignEnrollmentUploadUseCase,
  type EnrollmentUploadPurpose,
} from './presign-enrollment-upload.use-case';

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Dev/test helper: mimics the client flow (presign → PUT to Railway)
 * so enrollment can be exercised without a frontend.
 */
@Injectable()
export class DevUploadEnrollmentFileUseCase {
  constructor(
    private readonly config: AppConfigService,
    private readonly presignUpload: PresignEnrollmentUploadUseCase,
  ) {}

  async execute(input: {
    purpose: EnrollmentUploadPurpose;
    originalFilename: string;
    contentType: string;
    buffer: Buffer;
  }) {
    this.assertNonProduction();

    if (!input.buffer?.length) {
      throw new AppError('VALIDATION_ERROR', 'Uploaded file is empty', 400);
    }

    if (input.buffer.length > MAX_BYTES) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Uploaded file must be 5MB or smaller',
        400,
      );
    }

    const contentType = input.contentType || 'application/octet-stream';
    const presigned = await this.presignUpload.execute({
      purpose: input.purpose,
      originalFilename: input.originalFilename,
      contentType,
    });

    const putResponse = await fetch(presigned.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: new Uint8Array(input.buffer),
    });

    if (!putResponse.ok) {
      const detail = await putResponse.text().catch(() => '');
      throw new AppError(
        'UPLOAD_FAILED',
        `Railway upload failed with status ${putResponse.status}${
          detail ? `: ${detail.slice(0, 200)}` : ''
        }`,
        502,
      );
    }

    return {
      objectKey: presigned.objectKey,
      contentType: presigned.contentType,
      purpose: presigned.purpose,
      size: input.buffer.length,
    };
  }

  private assertNonProduction(): void {
    if (this.config.isProduction) {
      throw new AppError('NOT_FOUND', 'Not found', 404);
    }
  }
}
