import { AppError } from '../../../platform/http/app-error';
import type { ActivityLogRepository } from '../../activity-log/application/activity-log.repository';
import type { UserRepository } from './user.repository';
import { GetFieldWorkerDetailUseCase } from './get-field-worker-detail.use-case';

describe('GetFieldWorkerDetailUseCase', () => {
  const fieldWorker = {
    id: '01900000-0000-7000-8000-000000000010',
    name: 'Amina Yusuf',
    email: 'amina.yusuf@plaschema.ng',
    passwordHash: 'hash',
    role: 'field_worker' as const,
    status: 'active' as const,
    phone: '+2348034567890',
    lastSyncedAt: new Date('2026-08-29T20:00:00.000Z'),
    assignedWards: [{ id: 'ward-1', name: 'Vom Central', lga: 'Jos South' }],
    createdAt: new Date('2024-06-01T00:00:00.000Z'),
    updatedAt: new Date('2024-06-01T00:00:00.000Z'),
  };

  const adminActor = {
    id: '01900000-0000-7000-8000-000000000001',
    email: 'admin@cbhi.local',
    role: 'admin' as const,
    name: 'Admin',
    status: 'active' as const,
  };

  const fieldWorkerActor = {
    id: fieldWorker.id,
    email: fieldWorker.email,
    role: 'field_worker' as const,
    name: fieldWorker.name,
    status: 'active' as const,
  };

  let users: jest.Mocked<UserRepository>;
  let activityLogs: jest.Mocked<ActivityLogRepository>;
  let useCase: GetFieldWorkerDetailUseCase;

  beforeEach(() => {
    users = {
      findById: jest.fn(),
      findFieldWorkerDetailAggregates: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    activityLogs = {
      findRecentByActor: jest.fn(),
    } as unknown as jest.Mocked<ActivityLogRepository>;

    useCase = new GetFieldWorkerDetailUseCase(users, activityLogs);
  });

  it('returns 404 when the user is not a field worker', async () => {
    users.findById.mockResolvedValue({
      ...fieldWorker,
      role: 'admin',
    });

    await expect(
      useCase.execute(adminActor, fieldWorker.id),
    ).rejects.toMatchObject({
      code: 'USER_NOT_FOUND',
    } satisfies Partial<AppError>);
  });

  it('forbids a field worker from viewing another worker detail', async () => {
    await expect(
      useCase.execute(fieldWorkerActor, '01900000-0000-7000-8000-000000000099'),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
    } satisfies Partial<AppError>);
  });

  it('returns field worker detail for admin and own profile for field worker', async () => {
    users.findById.mockResolvedValue(fieldWorker);
    users.findFieldWorkerDetailAggregates.mockResolvedValue({
      stats: {
        totalEnrolled: 156,
        enrollmentsToday: 4,
        enrollmentsThisMonth: 31,
        lastEnrollmentAt: new Date('2026-08-29T18:00:00.000Z'),
        lastSyncedAt: fieldWorker.lastSyncedAt,
      },
      wards: [
        { id: 'ward-1', name: 'Vom Central', lga: 'Jos South', state: 'Plateau' },
      ],
    });
    activityLogs.findRecentByActor.mockResolvedValue([
      {
        id: 'log-1',
        category: 'enrollment',
        action: 'created',
        summary: 'Musa Ibrahim enrolled by Amina Yusuf',
        wardId: 'ward-1',
        actor: { id: fieldWorker.id, name: fieldWorker.name },
        enrollmentId: 'enrollment-1',
        occurredAt: new Date('2026-08-29T18:00:00.000Z'),
      },
    ]);

    const result = await useCase.execute(fieldWorkerActor, fieldWorker.id);

    expect(result.fieldWorker).toEqual({
      id: fieldWorker.id,
      name: fieldWorker.name,
      email: fieldWorker.email,
      phone: fieldWorker.phone,
      status: fieldWorker.status,
      lastSyncedAt: fieldWorker.lastSyncedAt,
      createdAt: fieldWorker.createdAt,
      updatedAt: fieldWorker.updatedAt,
    });
    expect(result.fieldWorker).not.toHaveProperty('assignedWards');
    expect(result.stats.totalEnrolled).toBe(156);
    expect(result.wards).toHaveLength(1);
    expect(result.activityLog).toHaveLength(1);
  });
});
