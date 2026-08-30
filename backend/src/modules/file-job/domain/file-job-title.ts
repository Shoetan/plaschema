import type { FileJobFormat, FileJobKind } from './file-job';

export function formatFileJobTimestampLagos(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const day = parts.find((part) => part.type === 'day')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const year = parts.find((part) => part.type === 'year')?.value;
  const hour = parts.find((part) => part.type === 'hour')?.value;
  const minute = parts.find((part) => part.type === 'minute')?.value;

  if (!day || !month || !year || !hour || !minute) {
    throw new Error('Unable to format Africa/Lagos timestamp for file job title');
  }

  return `${day}-${month}-${year} ${hour}:${minute}`;
}

export function buildFileJobTitle(input: {
  kind: FileJobKind;
  format: FileJobFormat;
  enrollmentCount?: number;
  createdAt?: Date;
}): string {
  const timestamp = formatFileJobTimestampLagos(input.createdAt ?? new Date());

  if (input.kind === 'id_card') {
    const count = input.enrollmentCount ?? 0;
    return `ID Cards (${count}) — ${timestamp}`;
  }

  return `Enrollment Report (${input.format}) — ${timestamp}`;
}
