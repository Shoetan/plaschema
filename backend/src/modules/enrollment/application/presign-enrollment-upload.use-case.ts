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
export class PresignEnrollmentUploadUseCase {
  constructor(
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
  ) {}

  async execute(input: {
    purpose: EnrollmentUploadPurpose;
    originalFilename: string;
    contentType: string;
  }) {
    if (!ALLOWED_MIME_TYPES.has(input.contentType)) {
      throw new AppError(
        'VALIDATION_ERROR',
        'File must be JPEG, PNG, WebP, or PDF',
        400,
      );
    }

    const prefix =
      input.purpose === 'passport'
        ? 'enrollments/passports'
        : 'enrollments/id-documents';

    const result = await this.storage.createUploadUrl({
      prefix,
      originalFilename: input.originalFilename || `${createUuidV7()}.bin`,
      contentType: input.contentType,
    });

    return {
      objectKey: result.objectKey,
      contentType: result.contentType,
      purpose: input.purpose,
      uploadUrl: result.uploadUrl,
      expiresInSeconds: result.expiresInSeconds,
      method: 'PUT' as const,
    };
  }
}
