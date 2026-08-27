import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { AppError } from './app-error';

export type CsvRow = Record<string, string>;

export type TabularParseOptions = {
  filename?: string;
};

type TabularFormat = 'csv' | 'xlsx';

const SUPPORTED_EXTENSIONS = ['.csv', '.xlsx', '.xls'] as const;

export function assertSupportedBatchUpload(
  file?: Express.Multer.File,
): Express.Multer.File {
  if (!file?.buffer) {
    throw new AppError(
      'VALIDATION_ERROR',
      'CSV or Excel (.xlsx/.xls) file is required',
      400,
    );
  }

  const filename = file.originalname?.toLowerCase() ?? '';
  const hasKnownExtension = SUPPORTED_EXTENSIONS.some((ext) =>
    filename.endsWith(ext),
  );
  if (filename && !hasKnownExtension) {
    throw new AppError(
      'VALIDATION_ERROR',
      'File must be .csv, .xlsx, or .xls',
      400,
    );
  }

  return file;
}

function detectTabularFormat(
  buffer: Buffer,
  filename?: string,
): TabularFormat {
  const lower = (filename ?? '').toLowerCase();
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    return 'xlsx';
  }
  if (lower.endsWith('.csv')) {
    return 'csv';
  }

  // ZIP / OOXML (.xlsx)
  if (buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4b) {
    return 'xlsx';
  }

  // OLE Compound Document (.xls)
  if (
    buffer.length >= 4 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0
  ) {
    return 'xlsx';
  }

  return 'csv';
}

function stringifyCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}

export function parseCsvBuffer(buffer: Buffer): CsvRow[] {
  if (!buffer || buffer.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'Upload file is empty', 400);
  }

  const rows = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as CsvRow[];

  if (rows.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'Upload file has no data rows', 400);
  }

  return rows;
}

export function parseXlsxBuffer(buffer: Buffer): CsvRow[] {
  if (!buffer || buffer.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'Upload file is empty', 400);
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, {
      type: 'buffer',
      cellDates: true,
    });
  } catch {
    throw new AppError(
      'VALIDATION_ERROR',
      'Unable to read Excel file. Upload a valid .xlsx or .xls file',
      400,
    );
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new AppError('VALIDATION_ERROR', 'Excel file has no sheets', 400);
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
  });

  const rows = rawRows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, stringifyCell(value)]),
    ),
  );

  const nonEmpty = rows.filter((row) =>
    Object.values(row).some((value) => value.trim().length > 0),
  );

  if (nonEmpty.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'Upload file has no data rows', 400);
  }

  return nonEmpty;
}

/**
 * Parse a batch upload as CSV or Excel (first sheet).
 * Format is detected from filename when present, otherwise from file magic bytes.
 */
export function parseTabularBuffer(
  buffer: Buffer,
  options: TabularParseOptions = {},
): CsvRow[] {
  const format = detectTabularFormat(buffer, options.filename);
  return format === 'xlsx' ? parseXlsxBuffer(buffer) : parseCsvBuffer(buffer);
}

export function requireCsvColumns(rows: CsvRow[], required: string[]): void {
  const headers = Object.keys(rows[0] ?? {}).map((header) =>
    header.toLowerCase(),
  );
  const missing = required.filter(
    (column) => !headers.includes(column.toLowerCase()),
  );

  if (missing.length > 0) {
    throw new AppError(
      'VALIDATION_ERROR',
      `Upload is missing required columns: ${missing.join(', ')}`,
      400,
    );
  }
}

export function normalizeCsvRow(row: CsvRow): CsvRow {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.trim().toLowerCase(),
      typeof value === 'string' ? value.trim() : String(value ?? '').trim(),
    ]),
  );
}

export type BatchUploadResult = {
  created: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
};
