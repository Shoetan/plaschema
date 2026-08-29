import { Inject, Injectable } from '@nestjs/common';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../../platform/storage/object-storage';
import type { Enrollment } from '../domain/enrollment';

export type EnrollmentWithFileUrls = Enrollment & {
  passportUrl: string;
  idDocumentUrl: string;
  fileUrlExpiresInSeconds: number;
  hasPrinted: boolean;
};

@Injectable()
export class AttachEnrollmentFileUrls {
  constructor(
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
  ) {}

  async forOne(enrollment: Enrollment): Promise<EnrollmentWithFileUrls> {
    const [passport, idDocument] = await Promise.all([
      this.storage.createReadUrl(enrollment.passportObjectKey),
      this.storage.createReadUrl(enrollment.idDocumentObjectKey),
    ]);

    return {
      ...enrollment,
      passportUrl: passport.readUrl,
      idDocumentUrl: idDocument.readUrl,
      fileUrlExpiresInSeconds: passport.expiresInSeconds,
      hasPrinted: enrollment.printedAt != null || enrollment.printCount > 0,
    };
  }

  async forMany(
    enrollments: Enrollment[],
  ): Promise<EnrollmentWithFileUrls[]> {
    return Promise.all(enrollments.map((item) => this.forOne(item)));
  }
}
