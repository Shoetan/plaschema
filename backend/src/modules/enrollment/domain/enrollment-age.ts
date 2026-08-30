function subUtcYears(date: Date, years: number): Date {
  const next = new Date(date);
  next.setUTCFullYear(next.getUTCFullYear() - years);
  return next;
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/**
 * Map an inclusive age range to a dateOfBirth range (UTC calendar dates).
 * minAge: born on or before (refDate - minAge years).
 * maxAge: born on or after the day after (refDate - (maxAge + 1) years).
 */
export function dateOfBirthRangeForAge(
  ageMin?: number,
  ageMax?: number,
  refDate = new Date(),
): { gte?: Date; lte?: Date } | undefined {
  const filter: { gte?: Date; lte?: Date } = {};

  if (ageMin != null) {
    filter.lte = subUtcYears(refDate, ageMin);
  }

  if (ageMax != null) {
    filter.gte = addUtcDays(subUtcYears(refDate, ageMax + 1), 1);
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
}

export function computeEnrollmentAge(
  dateOfBirth: Date | string,
  refDate = new Date(),
): number {
  const dob =
    typeof dateOfBirth === 'string'
      ? new Date(`${dateOfBirth}T00:00:00.000Z`)
      : dateOfBirth;

  let age = refDate.getUTCFullYear() - dob.getUTCFullYear();
  const monthDiff = refDate.getUTCMonth() - dob.getUTCMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && refDate.getUTCDate() < dob.getUTCDate())
  ) {
    age -= 1;
  }

  return age;
}

export function formatExportDateDdMmYyyy(
  value: Date | string | null | undefined,
): string {
  if (!value) {
    return '';
  }

  const date =
    typeof value === 'string'
      ? value.includes('T')
        ? new Date(value)
        : new Date(`${value}T00:00:00.000Z`)
      : value;

  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}-${month}-${year}`;
}
