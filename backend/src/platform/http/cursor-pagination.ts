export type CursorListQuery = {
  cursor?: string;
  limit: number;
};

export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
};

/**
 * Build a cursor page from a fetch of `limit + 1` rows ordered by id ascending.
 */
export function buildCursorPage<T extends { id: string }>(
  rows: T[],
  limit: number,
): CursorPage<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];

  return {
    items,
    nextCursor: hasMore && last ? last.id : null,
    hasMore,
    limit,
  };
}
