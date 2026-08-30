import type { AppConfigService } from '../../../platform/config/app-config.service';
import type { CapitationRepository } from './capitation.repository';
import { PreviewCapitationUseCase } from './preview-capitation.use-case';

describe('PreviewCapitationUseCase', () => {
  let capitation: jest.Mocked<CapitationRepository>;
  let config: Pick<AppConfigService, 'capitationRate'>;
  let useCase: PreviewCapitationUseCase;

  beforeEach(() => {
    capitation = {
      preview: jest.fn(),
    } as unknown as jest.Mocked<CapitationRepository>;

    config = { capitationRate: 700 };
    useCase = new PreviewCapitationUseCase(
      capitation,
      config as AppConfigService,
    );
  });

  it('previews capitation using the configured default rate', async () => {
    capitation.preview.mockResolvedValue({
      month: 8,
      year: 2026,
      rate: 700,
      totalFacilities: 1,
      totalBeneficiaries: 2,
      totalCapitation: 1400,
      records: [],
    });

    await useCase.execute({ month: 8, year: 2026 });

    expect(capitation.preview).toHaveBeenCalledWith(8, 2026, 700);
  });
});
