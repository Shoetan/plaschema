import { AppError } from '../../../platform/http/app-error';
import type { ActivityLogRepository } from '../../activity-log/application/activity-log.repository';
import type { CapitationRepository } from '../../capitation/application/capitation.repository';
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
  let capitation: jest.Mocked<CapitationRepository>;
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

    capitation = {
      findFacilityCapitation: jest.fn(),
    } as unknown as jest.Mocked<CapitationRepository>;

    useCase = new GetHealthFacilityDetailUseCase(
      facilities,
      activityLogs,
      capitation,
    );
  });

  it('returns 404 when the facility does not exist', async () => {
    facilities.findById.mockResolvedValue(null);

    await expect(useCase.execute(facility.id)).rejects.toMatchObject({
      code: 'HEALTH_FACILITY_NOT_FOUND',
    } satisfies Partial<AppError>);
  });

  it('returns facility detail with capitation and activity log', async () => {
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

    const capitationDetail = {
      implemented: true as const,
      currentAmount: 1400,
      currency: 'NGN' as const,
      records: [
        {
          month: 8,
          year: 2026,
          period: 'August 2026',
          beneficiaryCount: 2,
          rate: 700,
          amount: 1400,
          generatedAt: new Date('2026-08-29T12:00:00.000Z'),
        },
      ],
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
    capitation.findFacilityCapitation.mockResolvedValue(capitationDetail);

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
    expect(result.stats.currentCapitation).toBe(1400);
    expect(result.capitation).toEqual(capitationDetail);
    expect(result.activityLog).toEqual([latestActivity]);
  });
});
