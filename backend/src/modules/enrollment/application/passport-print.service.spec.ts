import { PassportPrintService } from './passport-print.service';
import type { ObjectStorage } from '../../../platform/storage/object-storage';
import type { EnrollmentRepository } from '../application/enrollment.repository';

describe('PassportPrintService', () => {
  const originalKey = 'enrollments/passports/photo.jpg';
  const printKey = 'enrollments/passports/print/photo.jpg';

  function createService(overrides?: {
    storage?: Partial<ObjectStorage>;
    enrollments?: Partial<EnrollmentRepository>;
  }) {
    const storage: ObjectStorage = {
      createUploadUrl: jest.fn(),
      createReadUrl: jest.fn(),
      exists: jest.fn().mockResolvedValue(false),
      putObject: jest.fn().mockResolvedValue(undefined),
      getObject: jest.fn(),
      ...overrides?.storage,
    };

    const enrollments: EnrollmentRepository = {
      allocateEnrollmentId: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findByIdempotencyId: jest.fn(),
      findByIdentityKey: jest.fn(),
      findManyByIds: jest.fn(),
      findManyStatusByIds: jest.fn(),
      updateStatus: jest.fn(),
      markPrinted: jest.fn(),
      setPassportPrintObjectKey: jest.fn().mockResolvedValue(undefined),
      list: jest.fn(),
      iterateForExport: jest.fn(),
      ...overrides?.enrollments,
    };

    return {
      service: new PassportPrintService(storage, enrollments),
      storage,
      enrollments,
    };
  }

  it('reuses an existing stored print variant', async () => {
    const printBuffer = Buffer.from('print');
    const { service, storage, enrollments } = createService({
      storage: {
        exists: jest.fn().mockResolvedValue(true),
        getObject: jest.fn().mockResolvedValue({
          body: printBuffer,
          contentType: 'image/jpeg',
        }),
      },
    });

    const result = await service.getBufferForIdCard({
      enrollmentId: 'enrollment-id',
      passportObjectKey: originalKey,
      passportPrintObjectKey: printKey,
    });

    expect(result).toBe(printBuffer);
    expect(storage.putObject).not.toHaveBeenCalled();
    expect(enrollments.setPassportPrintObjectKey).not.toHaveBeenCalled();
  });

  it('creates, stores, and backfills the print key for legacy enrollments', async () => {
    const original = await import('sharp').then((mod) =>
      mod.default({
        create: {
          width: 1200,
          height: 1600,
          channels: 3,
          background: { r: 10, g: 20, b: 30 },
        },
      })
        .jpeg()
        .toBuffer(),
    );

    const { service, storage, enrollments } = createService({
      storage: {
        exists: jest.fn().mockResolvedValue(false),
        getObject: jest
          .fn()
          .mockResolvedValueOnce({
            body: original,
            contentType: 'image/jpeg',
          })
          .mockResolvedValueOnce({
            body: Buffer.from('stored-print'),
            contentType: 'image/jpeg',
          }),
      },
    });

    const result = await service.getBufferForIdCard({
      enrollmentId: 'enrollment-id',
      passportObjectKey: originalKey,
      passportPrintObjectKey: null,
    });

    expect(storage.putObject).toHaveBeenCalledWith(
      expect.objectContaining({
        objectKey: printKey,
        contentType: 'image/jpeg',
      }),
    );
    expect(enrollments.setPassportPrintObjectKey).toHaveBeenCalledWith(
      'enrollment-id',
      printKey,
    );
    expect(result?.toString()).toBe('stored-print');
  });
});
