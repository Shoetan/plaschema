import { fieldWorkerCanAccessWard, fieldWorkerWardListFilter } from './field-worker-ward-access';

describe('fieldWorkerCanAccessWard', () => {
  it('allows any ward when the worker has no assignments', () => {
    expect(fieldWorkerCanAccessWard([], 'ward-1')).toBe(true);
  });

  it('allows only assigned wards when assignments exist', () => {
    const assigned = [{ id: 'ward-1' }, { id: 'ward-2' }];
    expect(fieldWorkerCanAccessWard(assigned, 'ward-1')).toBe(true);
    expect(fieldWorkerCanAccessWard(assigned, 'ward-3')).toBe(false);
  });
});

describe('fieldWorkerWardListFilter', () => {
  it('returns undefined (no filter) when unassigned', () => {
    expect(fieldWorkerWardListFilter([])).toBeUndefined();
  });

  it('returns assigned ward ids when scoped', () => {
    expect(
      fieldWorkerWardListFilter([{ id: 'ward-1' }, { id: 'ward-2' }]),
    ).toEqual(['ward-1', 'ward-2']);
  });
});
