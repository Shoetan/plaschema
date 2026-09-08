import path from 'node:path';

/** JPEG print variant stored beside the original passport upload. */
export function buildPassportPrintObjectKey(originalObjectKey: string): string {
  const normalized = originalObjectKey.replace(/\\/g, '/').replace(/^\/+/, '');
  const dir = path.posix.dirname(normalized);
  const base = path.posix.basename(normalized, path.extname(normalized));
  return `${dir}/print/${base}.jpg`;
}
