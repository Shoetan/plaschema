import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../../platform/storage/object-storage';
import { buildPassportPrintObjectKey } from '../domain/passport-print-object-key';
import {
  isPassportPrintSourceContentType,
  resizePassportForIdCard,
} from '../infrastructure/passport-print-image';
import {
  ENROLLMENT_REPOSITORY,
  type EnrollmentRepository,
} from './enrollment.repository';

export type PassportPrintFetchInput = {
  enrollmentId: string;
  passportObjectKey: string;
  passportPrintObjectKey: string | null;
};

@Injectable()
export class PassportPrintService {
  private readonly logger = new Logger(PassportPrintService.name);

  constructor(
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly enrollments: EnrollmentRepository,
  ) {}

  /**
   * Creates (or reuses) a stored JPEG print variant for a passport object key.
   * Returns null when the source is not a raster image or resize fails.
   */
  async ensureStored(originalObjectKey: string): Promise<string | null> {
    const printObjectKey = buildPassportPrintObjectKey(originalObjectKey);
    if (await this.storage.exists(printObjectKey)) {
      return printObjectKey;
    }

    let original: { body: Buffer; contentType?: string };
    try {
      original = await this.storage.getObject(originalObjectKey);
    } catch (error) {
      this.logger.warn(
        `Passport original missing for ${originalObjectKey}: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
      return null;
    }

    if (!isPassportPrintSourceContentType(original.contentType)) {
      return null;
    }

    try {
      const resized = await resizePassportForIdCard(original.body);
      await this.storage.putObject({
        objectKey: printObjectKey,
        body: resized,
        contentType: 'image/jpeg',
      });
      return printObjectKey;
    } catch (error) {
      this.logger.warn(
        `Passport print resize failed for ${originalObjectKey}: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
      return null;
    }
  }

  /**
   * Returns a print-sized passport buffer for ID card rendering.
   * Uses the stored print variant when available; otherwise creates it and
   * persists the key on the enrollment (legacy backfill). Falls back to an
   * in-memory resize of the original when storage of the variant fails.
   */
  async getBufferForIdCard(input: PassportPrintFetchInput): Promise<Buffer | null> {
    let printObjectKey = input.passportPrintObjectKey;

    if (printObjectKey && !(await this.storage.exists(printObjectKey))) {
      printObjectKey = null;
    }

    if (!printObjectKey) {
      printObjectKey = await this.ensureStored(input.passportObjectKey);
      if (printObjectKey) {
        await this.enrollments.setPassportPrintObjectKey(
          input.enrollmentId,
          printObjectKey,
        );
      }
    }

    if (printObjectKey) {
      try {
        const stored = await this.storage.getObject(printObjectKey);
        return stored.body;
      } catch (error) {
        this.logger.warn(
          `Stored passport print missing for ${printObjectKey}: ${
            error instanceof Error ? error.message : 'unknown'
          }`,
        );
      }
    }

    return this.resizeOriginalInMemory(input.passportObjectKey);
  }

  private async resizeOriginalInMemory(
    originalObjectKey: string,
  ): Promise<Buffer | null> {
    try {
      const original = await this.storage.getObject(originalObjectKey);
      if (!isPassportPrintSourceContentType(original.contentType)) {
        return null;
      }
      return await resizePassportForIdCard(original.body);
    } catch (error) {
      this.logger.warn(
        `Passport in-memory resize failed for ${originalObjectKey}: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
      return null;
    }
  }
}
