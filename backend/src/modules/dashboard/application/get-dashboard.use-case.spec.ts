import { AppError } from '../../../platform/http/app-error';
import type { ActivityLogRepository } from '../../activity-log/application/activity-log.repository';
import type { DashboardRepository } from './dashboard.repository';
import { GetDashboardUseCase } from './get-dashboard.use-case';

describe('GetDashboardUseCase', () => {
  let dashboard: jest.Mocked<DashboardRepository>;
  let activityLogs: jest.Mocked<ActivityLogRepository>;
  let useCase: GetDashboardUseCase;

  const overview = {
    kpis: {
      totalEnrollments: { value: 10, changePercent: 5 },
      activeBeneficiaries: { value: 8, changePercent: 2 },
      inactiveBeneficiaries: { value: 1, changePercent: 0 },
      newEnrollments: { value: 3, changePercent: 50 },
      totalFacilities: { value: 4, changeAbsolute: 1 },
      fieldWorkers: { value: 2, changeAbsolute: 0 },
    },
    enrollmentTrend: {
      total: 3,
      average: 1,
      granularity: 'monthly' as const,
      points: [{ key: '2026-08', label: 'Aug', count: 3 }],
    },
    enrollmentByCategory: [{ category: 'IDPs', count: 3 }],
    enrollmentByStatus: {
      active: { count: 2, percent: 66.7 },
      inactive: { count: 1, percent: 33.3 },
    },
    enrollmentByWard: [],
    enrollmentByLga: [],
    facilityOverview: {
      totalFacilities: 4,
      activeFacilities: 3,
      totalBeneficiaries: 3,
      items: [],
    },
    fieldWorkerPerformance: {
      totalFieldWorkers: 2,
      activeFieldWorkers: 2,
      totalEnrolled: 3,
      averagePerWorker: 2,
      items: [],
    },
    recentEnrollments: [],
  };

  beforeEach(() => {
    dashboard = {
      findWardLga: jest.fn(),
      loadOverview: jest.fn(),
    } as unknown as jest.Mocked<DashboardRepository>;

    activityLogs = {
      findRecent: jest.fn(),
    } as unknown as jest.Mocked<ActivityLogRepository>;

    useCase = new GetDashboardUseCase(dashboard, activityLogs);
  });

  it('returns 404 when wardId does not exist', async () => {
    dashboard.findWardLga.mockResolvedValue(null);

    await expect(
      useCase.execute({
        wardId: '01900000-0000-7000-8000-000000000001',
        period: '30d',
        trend: 'monthly',
      }),
    ).rejects.toMatchObject({
      code: 'WARD_NOT_FOUND',
    } satisfies Partial<AppError>);
  });

  it('returns 400 when wardId does not belong to lga', async () => {
    dashboard.findWardLga.mockResolvedValue('Jos South');

    await expect(
      useCase.execute({
        lga: 'Riyom',
        wardId: '01900000-0000-7000-8000-000000000001',
        period: '30d',
        trend: 'monthly',
      }),
    ).rejects.toMatchObject({
      code: 'WARD_LGA_MISMATCH',
      statusCode: 400,
    } satisfies Partial<AppError>);
  });

  it('loads overview and recent activity for a valid query', async () => {
    dashboard.findWardLga.mockResolvedValue('Jos South');
    dashboard.loadOverview.mockResolvedValue(overview);
    activityLogs.findRecent.mockResolvedValue([
      {
        id: 'log-1',
        category: 'enrollment',
        action: 'created',
        summary: 'Musa Ibrahim enrolled',
        wardId: '01900000-0000-7000-8000-000000000001',
        ward: {
          id: '01900000-0000-7000-8000-000000000001',
          name: 'Vom Central',
        },
        actor: { id: 'actor-1', name: 'Amina Yusuf' },
        enrollmentId: 'enrollment-1',
        occurredAt: new Date('2026-08-29T20:00:00.000Z'),
      },
    ]);

    const result = await useCase.execute({
      lga: 'Jos South',
      wardId: '01900000-0000-7000-8000-000000000001',
      period: '30d',
      trend: 'monthly',
    });

    expect(result.filters.lga).toBe('Jos South');
    expect(result.filters.period).toBe('30d');
    expect(result.kpis.newEnrollments.value).toBe(3);
    expect(result.recentActivity).toHaveLength(1);
    expect(result.recentActivity[0]?.ward.name).toBe('Vom Central');
    expect(activityLogs.findRecent).toHaveBeenCalledWith(
      expect.objectContaining({
        wardId: '01900000-0000-7000-8000-000000000001',
        lga: undefined,
      }),
      10,
    );
  });
});
