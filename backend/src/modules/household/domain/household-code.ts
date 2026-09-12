/** Numeric suffix after the final hyphen in codes like `JOS-VOM-001`. */
export function parseHouseholdCodeSuffix(householdCode: string): number | null {
  const trimmed = householdCode.trim();
  const lastHyphen = trimmed.lastIndexOf('-');
  if (lastHyphen < 0 || lastHyphen === trimmed.length - 1) {
    return null;
  }

  const suffix = trimmed.slice(lastHyphen + 1);
  if (!/^\d+$/.test(suffix)) {
    return null;
  }

  return Number.parseInt(suffix, 10);
}

export function formatHouseholdCodeSuffix(sequence: number): string {
  return String(sequence).padStart(3, '0');
}
