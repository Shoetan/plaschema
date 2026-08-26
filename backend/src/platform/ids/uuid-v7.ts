import { v7 as uuidv7, version as uuidVersion } from 'uuid';

/**
 * Generate a standards-compliant UUID v7.
 * Prefer application-side generation for portability across PostgreSQL versions.
 */
export function createUuidV7(): string {
  return uuidv7();
}

export function isUuidV7(value: string): boolean {
  try {
    return uuidVersion(value) === 7;
  } catch {
    return false;
  }
}
