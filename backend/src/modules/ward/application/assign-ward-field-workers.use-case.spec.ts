import { AppError } from '../../../platform/http/app-error';
import type { UserRepository } from '../../identity/application/user.repository';
import { AssignWardFieldWorkersUseCase } from './assign-ward-field-workers.use-case';
import type { WardRepository } from './ward.repository';

describe('AssignWardFieldWorkersUseCase', () => {
  const ward = {
    id: '01900000-0000-7000-8000-000000000001',
    name: 'Vom Central',
    lga: 'Jos South',
    status: 'active' as const,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  const actor = {
    id: 'admin-id',
    email: 'admin@cbhi.local',
    role: 'admin' as const,
    name: 'Admin',
    status: 'active' as const,
  };

  let wards: jest.Mocked<WardRepository>;
  let users: jest.Mocked<UserRepository>;
  let recordActivity: { execute: jest.Mock };
  let useCase: AssignWardFieldWorkersUseCase;

  beforeEach(() => {
    wards = {
      findById: jest.fn(),
      assignFieldWorkers: jest.fn(),
    } as unknown as jest.Mocked<WardRepository>;

    users = {
      findFieldWorkersByIds: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    recordActivity = { execute: jest.fn().mockResolvedValue(undefined) };

    useCase = new AssignWardFieldWorkersUseCase(
      wards,
      users,
      recordActivity as never,
    );
  });

  it('returns 404 when the ward does not exist', async () => {
    wards.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(actor, ward.id, ['worker-1']),
    ).rejects.toMatchObject({ code: 'WARD_NOT_FOUND' } satisfies Partial<AppError>);
  });

  it('rejects unknown field worker ids', async () => {
    wards.findById.mockResolvedValue(ward);
    users.findFieldWorkersByIds.mockResolvedValue([
      { id: 'worker-1', name: 'Amina Yusuf' },
    ]);

    await expect(
      useCase.execute(actor, ward.id, ['worker-1', 'worker-2']),
    ).rejects.toMatchObject({ code: 'FIELD_WORKER_NOT_FOUND' });
  });

  it('assigns field workers and logs newly added assignments', async () => {
    wards.findById.mockResolvedValue(ward);
    users.findFieldWorkersByIds.mockResolvedValue([
      { id: 'worker-1', name: 'Amina Yusuf' },
      { id: 'worker-2', name: 'Chidi Okafor' },
    ]);
    wards.assignFieldWorkers.mockResolvedValue({
      addedUserIds: ['worker-2'],
    });

    const result = await useCase.execute(actor, ward.id, [
      'worker-1',
      'worker-2',
      'worker-2',
    ]);

    expect(wards.assignFieldWorkers).toHaveBeenCalledWith(ward.id, [
      'worker-1',
      'worker-2',
    ]);
    expect(recordActivity.execute).toHaveBeenCalledTimes(1);
    expect(recordActivity.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'user',
        action: 'assigned',
        wardId: ward.id,
        actorUserId: actor.id,
        metadata: { userId: 'worker-2' },
      }),
    );
    expect(result.message).toBe('2 field workers assigned to Vom Central');
  });
});
