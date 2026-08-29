import { AppError } from '../../../platform/http/app-error';
import type { ActivityLogRepository } from '../../activity-log/application/activity-log.repository';
import { GetWardDetailUseCase } from './get-ward-detail.use-case';
import type { WardRepository } from './ward.repository';

describe('GetWardDetailUseCase', () => {
  const ward = {
    id: '01900000-0000-7000-8000-000000000001',
    name: 'Vom Central',
    lga: 'Jos South',
    status: 'active' as const,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  const aggregates = {
    stats: {
      totalBeneficiaries: 10,
      activeFieldWorkers: 2,
      enrollmentsThisMonth: 3,
      lastActivityAt: new Date('2026-08-29T10:00:00.000Z'),
    },
    enrollmentTrend: [{ month: '2026-08', label: 'Aug', count: 3 }],
    fieldWorkers: [],
    healthFacilities: [],
  };

  let wards: jest.Mocked<WardRepository>;
  let activityLogs: jest.Mocked<ActivityLogRepository>;
  let useCase: GetWardDetailUseCase;

  beforeEach(() => {
    wards = {
      findById: jest.fn(),
      findDetailAggregates: jest.fn(),
    } as unknown as jest.Mocked<WardRepository>;

    activityLogs = {
      findRecentByWard: jest.fn(),
      findLatestByWard: jest.fn(),
    } as unknown as jest.Mocked<ActivityLogRepository>;

    useCase = new GetWardDetailUseCase(wards, activityLogs);
  });

  it('returns 404 when the ward does not exist', async () => {
    wards.findById.mockResolvedValue(null);

    await expect(useCase.execute(ward.id)).rejects.toMatchObject({
      code: 'WARD_NOT_FOUND',
    } satisfies Partial<AppError>);
  });

  it('returns ward detail with unified activity log', async () => {
    const latestActivity = {
      id: 'log-1',
      category: 'enrollment' as const,
      action: 'created' as const,
      summary: 'Musa Ibrahim enrolled by Amina Yusuf',
      wardId: ward.id,
      actor: { id: 'actor-1', name: 'Amina Yusuf' },
      enrollmentId: 'enrollment-1',
      occurredAt: new Date('2026-08-29T20:00:00.000Z'),
    };

    wards.findById.mockResolvedValue(ward);
    wards.findDetailAggregates.mockResolvedValue(aggregates);
    activityLogs.findRecentByWard.mockResolvedValue([latestActivity]);
    activityLogs.findLatestByWard.mockResolvedValue(latestActivity);

    const result = await useCase.execute(ward.id);

    expect(result.ward.state).toBe('Plateau');
    expect(result.stats.lastActivityAt).toEqual(latestActivity.occurredAt);
    expect(result.activityLog).toEqual([latestActivity]);
  });
});
