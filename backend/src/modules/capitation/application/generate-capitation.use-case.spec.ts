import type { AppConfigService } from '../../../platform/config/app-config.service';
import type { CapitationRepository } from './capitation.repository';
import { GenerateCapitationUseCase } from './generate-capitation.use-case';

describe('GenerateCapitationUseCase', () => {
  const actor = {
    id: '01900000-0000-7000-8000-000000000001',
    email: 'admin@cbhi.local',
    name: 'Root Admin',
    role: 'admin' as const,
    status: 'active' as const,
  };

  let capitation: jest.Mocked<CapitationRepository>;
  let config: Pick<AppConfigService, 'capitationRate'>;
  let useCase: GenerateCapitationUseCase;

  beforeEach(() => {
    capitation = {
      computeRecords: jest.fn(),
      createRun: jest.fn(),
    } as unknown as jest.Mocked<CapitationRepository>;

    config = { capitationRate: 700 };
    useCase = new GenerateCapitationUseCase(
      capitation,
      config as AppConfigService,
    );
  });

  it('generates capitation for all active facilities using the default rate', async () => {
    const records = [
      {
        healthFacilityId: 'fac-1',
        facilityName: 'Tudun Wada PHC',
        lga: 'Jos North',
        beneficiaryCount: 2,
        rate: 700,
        amount: 1400,
      },
    ];

    capitation.computeRecords.mockResolvedValue(records);
    capitation.createRun.mockResolvedValue({
      runId: 'run-1',
      month: 8,
      year: 2026,
      rate: 700,
      generatedAt: new Date('2026-08-30T00:00:00.000Z'),
      totalFacilities: 1,
      totalBeneficiaries: 2,
      totalCapitation: 1400,
      recordCount: 1,
    });

    const result = await useCase.execute(actor, { month: 8, year: 2026 });

    expect(capitation.computeRecords).toHaveBeenCalledWith(700);
    expect(capitation.createRun).toHaveBeenCalledWith({
      month: 8,
      year: 2026,
      rate: 700,
      createdByUserId: actor.id,
      records,
    });
    expect(result.totalCapitation).toBe(1400);
  });

  it('allows overriding the default rate per request', async () => {
    capitation.computeRecords.mockResolvedValue([]);
    capitation.createRun.mockResolvedValue({
      runId: 'run-1',
      month: 8,
      year: 2026,
      rate: 570,
      generatedAt: new Date('2026-08-30T00:00:00.000Z'),
      totalFacilities: 0,
      totalBeneficiaries: 0,
      totalCapitation: 0,
      recordCount: 0,
    });

    await useCase.execute(actor, { month: 8, year: 2026, rate: 570 });

    expect(capitation.computeRecords).toHaveBeenCalledWith(570);
    expect(capitation.createRun).toHaveBeenCalledWith(
      expect.objectContaining({ rate: 570 }),
    );
  });
});
