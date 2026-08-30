/**
 * Start of the current calendar day in Africa/Lagos (WAT, UTC+1, no DST).
 */
export function startOfTodayInLagos(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('Unable to resolve Africa/Lagos calendar date');
  }

  return new Date(`${year}-${month}-${day}T00:00:00+01:00`);
}

/** YYYY-MM month key in Africa/Lagos. */
export function monthKeyInLagos(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;

  if (!year || !month) {
    throw new Error('Unable to resolve Africa/Lagos calendar month');
  }

  return `${year}-${month}`;
}

/** Start of the current calendar month in Africa/Lagos. */
export function startOfMonthInLagos(now = new Date()): Date {
  const key = monthKeyInLagos(now);
  return new Date(`${key}-01T00:00:00+01:00`);
}

/** Current calendar month (1–12) and year in Africa/Lagos. */
export function currentMonthYearInLagos(now = new Date()): {
  month: number;
  year: number;
} {
  const key = monthKeyInLagos(now);
  const [yearStr, monthStr] = key.split('-');
  return { year: Number(yearStr), month: Number(monthStr) };
}

export function formatCapitationPeriod(month: number, year: number): string {
  const monthStr = String(month).padStart(2, '0');
  const label = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Lagos',
    month: 'long',
  }).format(new Date(`${year}-${monthStr}-15T12:00:00+01:00`));
  return `${label} ${year}`;
}

export type LagosMonth = {
  month: string;
  label: string;
  start: Date;
};

/** Last N calendar months ending with the current Lagos month (inclusive). */
export function lastNMonthsInLagos(n: number, now = new Date()): LagosMonth[] {
  const currentKey = monthKeyInLagos(now);
  const [currentYearStr, currentMonthStr] = currentKey.split('-');
  const currentYear = Number(currentYearStr);
  const currentMonth = Number(currentMonthStr);

  let startYear = currentYear;
  let startMonth = currentMonth - (n - 1);
  while (startMonth <= 0) {
    startMonth += 12;
    startYear -= 1;
  }

  const months: LagosMonth[] = [];
  let y = startYear;
  let m = startMonth;

  for (let i = 0; i < n; i += 1) {
    const monthStr = String(m).padStart(2, '0');
    const monthKey = `${y}-${monthStr}`;
    const label = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Lagos',
      month: 'short',
    }).format(new Date(`${y}-${monthStr}-15T12:00:00+01:00`));

    months.push({
      month: monthKey,
      label,
      start: new Date(`${y}-${monthStr}-01T00:00:00+01:00`),
    });

    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }

  return months;
}
