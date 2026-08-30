import type { FileJobFormat } from './file-job';

const MAX_FILENAME_LENGTH = 180;

export function buildFileJobDownloadFilename(
  title: string,
  format: FileJobFormat,
): string {
  const extension = format === 'pdf' ? '.pdf' : '.xlsx';
  const sanitized = title
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  const withExtension = sanitized.toLowerCase().endsWith(extension)
    ? sanitized
    : `${sanitized}${extension}`;

  if (withExtension.length <= MAX_FILENAME_LENGTH) {
    return withExtension;
  }

  const stemMax = MAX_FILENAME_LENGTH - extension.length;
  return `${withExtension.slice(0, stemMax).trimEnd()}${extension}`;
}
