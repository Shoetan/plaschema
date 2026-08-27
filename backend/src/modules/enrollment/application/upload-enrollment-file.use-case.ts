import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../platform/http/app-error';
import { createUuidV7 } from '../../../platform/ids/uuid-v7';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../../platform/storage/object-storage';

export type EnrollmentUploadPurpose = 'passport' | 'id_document';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

@Injectable()
export class UploadEnrollmentFileUseCase {
  constructor(
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
  ) {}

  async execute(input: {
    purpose: EnrollmentUploadPurpose;
    originalFilename: string;
    contentType: string;
    buffer: Buffer;
  }) {
    if (!ALLOWED_MIME_TYPES.has(input.contentType)) {
      throw new AppError(
        'VALIDATION_ERROR',
        'File must be JPEG, PNG, WebP, or PDF',
        400,
      );
    }

    if (!input.buffer?.length) {
      throw new AppError('VALIDATION_ERROR', 'Uploaded file is empty', 400);
    }

    if (input.buffer.length > 5 * 1024 * 1024) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Uploaded file must be 5MB or smaller',
        400,
      );
    }

    const prefix =
      input.purpose === 'passport'
        ? 'enrollments/passports'
        : 'enrollments/id-documents';

    const stored = await this.storage.put({
      prefix,
      originalFilename: input.originalFilename || `${createUuidV7()}.bin`,
      buffer: input.buffer,
      contentType: input.contentType,
    });

    return {
      objectKey: stored.objectKey,
      contentType: stored.contentType,
      size: stored.size,
      purpose: input.purpose,
      // Temporary local stub URL shape; later replaced by presigned URLs.
      url: `/api/enrollments/files?objectKey=${encodeURIComponent(stored.objectKey)}`,
    };
  }
}
