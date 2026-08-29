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

/**
 * Coerce a query param to a boolean. Empty/omitted → undefined.
 * Accepts true/false, "true"/"false", 1/0 (case-insensitive strings).
 */
export function toQueryBool(value: unknown): boolean | undefined {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
    return undefined;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
  }
  return undefined;
}
