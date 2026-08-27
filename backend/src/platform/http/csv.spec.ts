import {
  normalizeCsvRow,
  parseCsvBuffer,
  parseTabularBuffer,
  parseXlsxBuffer,
  requireCsvColumns,
} from './csv';
import * as XLSX from 'xlsx';

function buildXlsxBuffer(rows: string[][]): Buffer {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1');
  return XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  }) as Buffer;
}

describe('tabular upload helpers', () => {
  it('parses csv and normalizes headers', () => {
    const buffer = Buffer.from('Name,LGA\nWard 1,Municipal\n');
    const rows = parseCsvBuffer(buffer).map(normalizeCsvRow);

    expect(rows).toEqual([{ name: 'Ward 1', lga: 'Municipal' }]);
  });

  it('parses xlsx first sheet', () => {
    const buffer = buildXlsxBuffer([
      ['Name', 'LGA', 'Ward'],
      ['Central Clinic', 'Municipal', 'Ward 1'],
    ]);

    const rows = parseXlsxBuffer(buffer).map(normalizeCsvRow);
    expect(rows).toEqual([
      { name: 'Central Clinic', lga: 'Municipal', ward: 'Ward 1' },
    ]);
  });

  it('detects xlsx from filename via parseTabularBuffer', () => {
    const buffer = buildXlsxBuffer([
      ['name', 'lga'],
      ['Ward 1', 'Municipal'],
    ]);

    const rows = parseTabularBuffer(buffer, {
      filename: 'wards.xlsx',
    }).map(normalizeCsvRow);

    expect(rows).toEqual([{ name: 'Ward 1', lga: 'Municipal' }]);
  });

  it('detects xlsx from magic bytes when filename is missing', () => {
    const buffer = buildXlsxBuffer([
      ['name', 'lga'],
      ['Ward 2', 'North'],
    ]);

    const rows = parseTabularBuffer(buffer).map(normalizeCsvRow);
    expect(rows).toEqual([{ name: 'Ward 2', lga: 'North' }]);
  });

  it('rejects missing columns', () => {
    const rows = parseCsvBuffer(Buffer.from('name\nWard 1\n'));
    expect(() => requireCsvColumns(rows, ['name', 'lga'])).toThrow(/lga/);
  });
});
