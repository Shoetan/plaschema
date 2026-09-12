import { AppError } from '../../../platform/http/app-error';
import type { UserRepository } from '../../identity/application/user.repository';
import type { HouseholdRepository } from './household.repository';
import { GetHouseholdCodeCountersUseCase } from './get-household-code-counters.use-case';

describe('GetHouseholdCodeCountersUseCase', () => {
  const actor = {
    id: '01900000-0000-7000-8000-000000000010',
    role: 'field_worker' as const,
    email: 'worker@cbhi.local',
    name: 'Field Worker',
    status: 'active' as const,
  };

  let households: jest.Mocked<
    Pick<
      HouseholdRepository,
      'findWardIdsWithHouseholds' | 'getHighestCodeSuffixByWardIds'
    >
  >;
  let users: jest.Mocked<Pick<UserRepository, 'findById'>>;
  let useCase: GetHouseholdCodeCountersUseCase;

  beforeEach(() => {
    households = {
      findWardIdsWithHouseholds: jest.fn(),
      getHighestCodeSuffixByWardIds: jest.fn(),
    };
    users = {
      findById: jest.fn(),
    };
    useCase = new GetHouseholdCodeCountersUseCase(
      households as unknown as HouseholdRepository,
      users as unknown as UserRepository,
    );
  });

  it('rejects non field workers', async () => {
    await expect(
      useCase.execute({ ...actor, role: 'admin' }),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
    } satisfies Partial<AppError>);
  });

  it('returns counters for assigned wards', async () => {
    users.findById.mockResolvedValue({
      id: actor.id,
      assignedWards: [
        { id: 'ward-1', name: 'Tafawa Balewa', lga: 'Barakin Ladi' },
        { id: 'ward-2', name: 'Vom', lga: 'Jos South' },
      ],
    } as unknown as Awaited<ReturnType<UserRepository['findById']>>);
    households.getHighestCodeSuffixByWardIds.mockResolvedValue(
      new Map([
        ['ward-1', 12],
        ['ward-2', 3],
      ]),
    );

    await expect(useCase.execute(actor)).resolves.toEqual([
      { wardId: 'ward-1', lastSuffix: '012' },
      { wardId: 'ward-2', lastSuffix: '003' },
    ]);
    expect(households.findWardIdsWithHouseholds).not.toHaveBeenCalled();
    expect(households.getHighestCodeSuffixByWardIds).toHaveBeenCalledWith([
      'ward-1',
      'ward-2',
    ]);
  });

  it('returns null suffixes for assigned wards without households', async () => {
    users.findById.mockResolvedValue({
      id: actor.id,
      assignedWards: [{ id: 'ward-1', name: 'Tafawa Balewa', lga: 'Barakin Ladi' }],
    } as unknown as Awaited<ReturnType<UserRepository['findById']>>);
    households.getHighestCodeSuffixByWardIds.mockResolvedValue(new Map());

    await expect(useCase.execute(actor)).resolves.toEqual([
      { wardId: 'ward-1', lastSuffix: null },
    ]);
  });

  it('uses all wards with households when the officer has no ward restrictions', async () => {
    users.findById.mockResolvedValue({
      id: actor.id,
      assignedWards: [],
    } as unknown as Awaited<ReturnType<UserRepository['findById']>>);
    households.findWardIdsWithHouseholds.mockResolvedValue(['ward-9']);
    households.getHighestCodeSuffixByWardIds.mockResolvedValue(
      new Map([['ward-9', 1]]),
    );

    await expect(useCase.execute(actor)).resolves.toEqual([
      { wardId: 'ward-9', lastSuffix: '001' },
    ]);
  });
});
