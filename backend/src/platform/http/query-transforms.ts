import { Transform } from 'class-transformer';

/**
 * Swagger "Try it out" often sends empty query strings (e.g. cursor=).
 * Treat those as omitted optional values.
 */
export function EmptyStringToUndefined() {
  return Transform(({ value }: { value: unknown }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    return value;
  });
}

/**
 * Coerce a query param to a finite integer, falling back when empty/invalid.
 */
export function toQueryInt(
  value: unknown,
  fallback: number,
  options?: { min?: number; max?: number },
): number {
  const min = options?.min ?? Number.MIN_SAFE_INTEGER;
  const max = options?.max ?? Number.MAX_SAFE_INTEGER;

  if (value === '' || value === null || value === undefined) {
    return fallback;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}
