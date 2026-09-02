import { AppError } from '../../../platform/http/app-error';
import type { UserRepository } from './user.repository';
import { ReportLastSyncUseCase } from './report-last-sync.use-case';

describe('ReportLastSyncUseCase', () => {
  const user = {
    id: '01900000-0000-7000-8000-000000000010',
    name: 'Amina Yusuf',
    email: 'amina.yusuf@plaschema.ng',
    passwordHash: 'hash',
    role: 'field_worker' as const,
    status: 'active' as const,
    phone: '+2348034567890',
    lastSyncedAt: null as Date | null,
    assignedWards: [{ id: 'ward-1', name: 'Vom Central', lga: 'Jos South' }],
    createdAt: new Date('2024-06-01T00:00:00.000Z'),
    updatedAt: new Date('2024-06-01T00:00:00.000Z'),
  };

  let users: jest.Mocked<UserRepository>;
  let useCase: ReportLastSyncUseCase;

  beforeEach(() => {
    users = {
      findById: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    useCase = new ReportLastSyncUseCase(users);
  });

  it('returns 404 when the user does not exist', async () => {
    users.findById.mockResolvedValue(null);

    await expect(useCase.execute(user.id)).rejects.toMatchObject({
      code: 'USER_NOT_FOUND',
    } satisfies Partial<AppError>);
  });

  it('updates lastSyncedAt and returns the public user', async () => {
    const syncedAt = new Date('2026-09-02T16:00:00.000Z');
    jest.useFakeTimers().setSystemTime(syncedAt);

    users.findById.mockResolvedValue(user);
    users.update.mockResolvedValue({
      ...user,
      lastSyncedAt: syncedAt,
    });

    const result = await useCase.execute(user.id);

    expect(users.update).toHaveBeenCalledWith(user.id, {
      lastSyncedAt: syncedAt,
    });
    expect(result.lastSyncedAt).toEqual(syncedAt);

    jest.useRealTimers();
  });
});
