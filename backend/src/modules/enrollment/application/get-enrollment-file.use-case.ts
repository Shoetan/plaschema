import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../platform/http/app-error';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../../platform/storage/object-storage';

@Injectable()
export class GetEnrollmentFileUseCase {
  constructor(
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
  ) {}

  async execute(objectKey: string) {
    const decoded = decodeURIComponent(objectKey);
    const file = await this.storage.get(decoded);
    if (!file) {
      throw new AppError('UPLOAD_NOT_FOUND', 'File not found', 404);
    }
    return { ...file, objectKey: decoded };
  }
}
