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
