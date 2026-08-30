import { AppError } from '../../../platform/http/app-error';
import type { HealthFacilityRepository } from '../../health-facility/application/health-facility.repository';
import type { CapitationRepository } from './capitation.repository';
import { ListCapitationsUseCase } from './list-capitations.use-case';

jest.mock('../../ward/domain/ward-date', () => ({
  currentMonthYearInLagos: () => ({ month: 8, year: 2026 }),
}));

describe('ListCapitationsUseCase', () => {
  let capitation: jest.Mocked<CapitationRepository>;
  let facilities: jest.Mocked<HealthFacilityRepository>;
  let useCase: ListCapitationsUseCase;

  beforeEach(() => {
    capitation = {
      list: jest.fn(),
    } as unknown as jest.Mocked<CapitationRepository>;

    facilities = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<HealthFacilityRepository>;

    useCase = new ListCapitationsUseCase(capitation, facilities);
  });

  it('defaults to the current Lagos month and year', async () => {
    capitation.list.mockResolvedValue({
      items: [],
      summary: null,
      nextCursor: null,
      hasMore: false,
      limit: 50,
    });

    await useCase.execute({ limit: 50 });

    expect(capitation.list).toHaveBeenCalledWith(
      expect.objectContaining({ month: 8, year: 2026 }),
    );
  });

  it('returns 404 when filtering by an unknown health facility', async () => {
    facilities.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        limit: 50,
        healthFacilityId: '01900000-0000-7000-8000-000000000099',
      }),
    ).rejects.toMatchObject({
      code: 'HEALTH_FACILITY_NOT_FOUND',
    } satisfies Partial<AppError>);
  });

  it('returns paginated data with summary from the repository', async () => {
    capitation.list.mockResolvedValue({
      items: [
        {
          id: 'rec-1',
          healthFacilityId: 'fac-1',
          facilityName: 'Tudun Wada PHC',
          lga: 'Jos North',
          month: 8,
          year: 2026,
          period: 'August 2026',
          beneficiaryCount: 2,
          rate: 700,
          amount: 1400,
        },
      ],
      summary: {
        runId: 'run-1',
        month: 8,
        year: 2026,
        rate: 700,
        generatedAt: new Date('2026-08-30T00:00:00.000Z'),
        totalFacilities: 1,
        totalBeneficiaries: 2,
        totalCapitation: 1400,
      },
      nextCursor: null,
      hasMore: false,
      limit: 50,
    });

    const result = await useCase.execute({
      limit: 50,
      month: 8,
      year: 2026,
      lga: 'Jos North',
    });

    expect(result.data).toHaveLength(1);
    expect(result.summary?.totalCapitation).toBe(1400);
    expect(result.meta.hasMore).toBe(false);
  });
});
