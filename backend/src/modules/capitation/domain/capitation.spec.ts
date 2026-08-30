import { sortCapitationListRecords } from './capitation';

describe('sortCapitationListRecords', () => {
  it('sorts by beneficiary count descending with zero-beneficiary facilities last', () => {
    const sorted = sortCapitationListRecords([
      { id: 'c', facilityName: 'Zero B', beneficiaryCount: 0 },
      { id: 'a', facilityName: 'Top', beneficiaryCount: 100 },
      { id: 'b', facilityName: 'Mid', beneficiaryCount: 50 },
      { id: 'd', facilityName: 'Zero A', beneficiaryCount: 0 },
    ]);

    expect(sorted.map((row) => row.id)).toEqual(['a', 'b', 'd', 'c']);
  });

  it('breaks ties by facility name then id', () => {
    const sorted = sortCapitationListRecords([
      { id: '2', facilityName: 'Beta Clinic', beneficiaryCount: 10 },
      { id: '1', facilityName: 'Alpha Clinic', beneficiaryCount: 10 },
    ]);

    expect(sorted.map((row) => row.id)).toEqual(['1', '2']);
  });
});
