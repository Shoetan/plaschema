import { buildPassportPrintObjectKey } from './passport-print-object-key';

describe('buildPassportPrintObjectKey', () => {
  it('places a JPEG print variant under a print/ subfolder', () => {
    expect(
      buildPassportPrintObjectKey('enrollments/passports/abc-123.png'),
    ).toBe('enrollments/passports/print/abc-123.jpg');
  });

  it('normalizes leading slashes and preserves nested folders', () => {
    expect(
      buildPassportPrintObjectKey('/enrollments/passports/2026/photo.webp'),
    ).toBe('enrollments/passports/2026/print/photo.jpg');
  });
});
