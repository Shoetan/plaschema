import { collapseWhitespace } from '../../../shared/text';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Normalize a person name for duplicate matching (case/spacing insensitive).
 */
export function normalizeEnrollmentNameKey(value: string): string {
  return collapseWhitespace(value).toLowerCase();
}

export function parseIsoDateOnly(value: string): Date {
  const match = ISO_DATE.exec(value.trim());
  if (!match) {
    throw new Error('Date must be YYYY-MM-DD');
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error('Invalid calendar date');
  }

  return date;
}

export function formatIsoDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function assertReasonableDateOfBirth(date: Date, now = new Date()): void {
  if (date.getTime() > now.getTime()) {
    throw new Error('Date of birth cannot be in the future');
  }

  const oldest = new Date(
    Date.UTC(now.getUTCFullYear() - 120, now.getUTCMonth(), now.getUTCDate()),
  );
  if (date.getTime() < oldest.getTime()) {
    throw new Error('Date of birth is unrealistically old');
  }
}
