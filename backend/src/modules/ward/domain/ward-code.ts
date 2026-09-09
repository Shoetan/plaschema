/** First three alphabetic characters, uppercased (e.g. "Jos South" → "JOS"). */
export function extractWardCodePrefix(value: string): string {
  return value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3);
}

/** `<LGA_3>-<NAME_3>` from normalized place names. */
export function deriveWardCodeBase(lga: string, name: string): string {
  const lgaPrefix = extractWardCodePrefix(lga);
  const namePrefix = extractWardCodePrefix(name);

  if (!lgaPrefix || !namePrefix) {
    throw new Error('Ward LGA and name must each contain at least one letter');
  }

  return `${lgaPrefix}-${namePrefix}`;
}

/** Pick a unique code from `base`, then `base-2`, `base-3`, … against `taken`. */
export function allocateUniqueWardCode(
  base: string,
  taken: ReadonlySet<string>,
): string {
  const normalizedTaken = new Set(
    [...taken].map((code) => code.toLowerCase()),
  );

  if (!normalizedTaken.has(base.toLowerCase())) {
    return base;
  }

  for (let suffix = 2; ; suffix++) {
    const candidate = `${base}-${suffix}`;
    if (!normalizedTaken.has(candidate.toLowerCase())) {
      return candidate;
    }
  }
}

export async function resolveUniqueWardCode(
  lga: string,
  name: string,
  isTaken: (code: string) => Promise<boolean>,
): Promise<string> {
  const base = deriveWardCodeBase(lga, name);

  for (let suffix = 0; ; suffix++) {
    const candidate = suffix === 0 ? base : `${base}-${suffix + 1}`;
    if (!(await isTaken(candidate))) {
      return candidate;
    }
  }
}
