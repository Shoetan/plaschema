/**
 * Collapse whitespace and trim. Does not change letter casing.
 */
export function collapseWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Title Case for person names (e.g. "john o'neil" → "John O'Neil").
 */
export function toTitleCase(value: string): string {
  const normalized = collapseWhitespace(value);
  if (!normalized) {
    return normalized;
  }

  return normalized
    .toLowerCase()
    .split(' ')
    .map((word) =>
      word
        .split(/([-'])/)
        .map((part) => {
          if (part === '-' || part === "'") {
            return part;
          }
          if (!part) {
            return part;
          }
          return part.charAt(0).toUpperCase() + part.slice(1);
        })
        .join(''),
    )
    .join(' ');
}

/**
 * Normalize place names (wards, facilities, LGAs): trim, collapse spaces, Title Case.
 */
export function normalizePlaceName(value: string): string {
  return toTitleCase(value);
}
