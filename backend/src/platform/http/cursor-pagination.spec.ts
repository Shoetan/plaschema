import { buildCursorPage } from './cursor-pagination';

describe('buildCursorPage', () => {
  it('returns nextCursor when more rows exist', () => {
    const rows = [
      { id: '1' },
      { id: '2' },
      { id: '3' },
    ];

    expect(buildCursorPage(rows, 2, 5)).toEqual({
      items: [{ id: '1' }, { id: '2' }],
      nextCursor: '2',
      hasMore: true,
      limit: 2,
      total: 5,
    });
  });

  it('clears nextCursor on the final page', () => {
    expect(buildCursorPage([{ id: '1' }], 2, 1)).toEqual({
      items: [{ id: '1' }],
      nextCursor: null,
      hasMore: false,
      limit: 2,
      total: 1,
    });
  });
});
