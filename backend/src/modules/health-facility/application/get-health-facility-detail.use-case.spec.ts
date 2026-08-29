import { AppError } from '../../../platform/http/app-error';
import type { ActivityLogRepository } from '../../activity-log/application/activity-log.repository';
import { GetHealthFacilityDetailUseCase } from './get-health-facility-detail.use-case';
import type { HealthFacilityRepository } from './health-facility.repository';

describe('GetHealthFacilityDetailUseCase', () => {
  const facility = {
    id: '01900000-0000-7000-8000-000000000020',
    name: 'Tudun Wada PHC',
    lga: 'Jos North',
    type: 'Primary Health Care',
    level: 'primary' as const,
    status: 'active' as const,
    wardId: 'ward-1',
    ward: { id: 'ward-1', name: 'Tudun Wada', lga: 'Jos North' },
    createdAt: new Date('2024-01-15T00:00:00.000Z'),
    updatedAt: new Date('2024-01-15T00:00:00.000Z'),
  };

  let facilities: jest.Mocked<HealthFacilityRepository>;
  let activityLogs: jest.Mocked<ActivityLogRepository>;
  let useCase: GetHealthFacilityDetailUseCase;

  beforeEach(() => {
    facilities = {
      findById: jest.fn(),
      findDetailAggregates: jest.fn(),
    } as unknown as jest.Mocked<HealthFacilityRepository>;

    activityLogs = {
      findRecentByHealthFacility: jest.fn(),
      findLatestByHealthFacility: jest.fn(),
    } as unknown as jest.Mocked<ActivityLogRepository>;

    useCase = new GetHealthFacilityDetailUseCase(facilities, activityLogs);
  });

  it('returns 404 when the facility does not exist', async () => {
    facilities.findById.mockResolvedValue(null);

    await expect(useCase.execute(facility.id)).rejects.toMatchObject({
      code: 'HEALTH_FACILITY_NOT_FOUND',
    } satisfies Partial<AppError>);
  });

  it('returns facility detail with capitation stub and activity log', async () => {
    const latestActivity = {
      id: 'log-1',
      category: 'enrollment' as const,
      action: 'created' as const,
      summary: 'Musa Ibrahim enrolled by Amina Yusuf',
      wardId: 'ward-1',
      actor: { id: 'worker-1', name: 'Amina Yusuf' },
      enrollmentId: 'enrollment-1',
      occurredAt: new Date('2026-08-29T20:00:00.000Z'),
    };

    facilities.findById.mockResolvedValue(facility);
    facilities.findDetailAggregates.mockResolvedValue({
      stats: {
        totalBeneficiaries: 156,
        enrollmentsThisMonth: 31,
        currentCapitation: null,
        lastActivityAt: new Date('2026-08-29T18:00:00.000Z'),
      },
    });
    activityLogs.findRecentByHealthFacility.mockResolvedValue([latestActivity]);
    activityLogs.findLatestByHealthFacility.mockResolvedValue(latestActivity);

    const result = await useCase.execute(facility.id);

    expect(result.facility.state).toBe('Plateau');
    expect(result.facility).toMatchObject({
      id: facility.id,
      name: facility.name,
      lga: facility.lga,
      type: facility.type,
      level: facility.level,
      status: facility.status,
      wardId: facility.wardId,
      ward: facility.ward,
    });
    expect(result.stats.totalBeneficiaries).toBe(156);
    expect(result.stats.currentCapitation).toBeNull();
    expect(result.capitation).toEqual({
      implemented: false,
      currentAmount: null,
      currency: 'NGN',
      records: [],
    });
    expect(result.activityLog).toEqual([latestActivity]);
  });
});
