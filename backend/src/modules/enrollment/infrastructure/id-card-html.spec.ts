import { buildIdCardSheetHtml } from './id-card-html';

describe('buildIdCardSheetHtml', () => {
  it('renders front + back markup with vertically centered identity block', () => {
    const html = buildIdCardSheetHtml([
      {
        enrollmentId: 'PL/CBHI/2026/001',
        fullName: 'Musa Ibrahim',
        emergencyPhone: '08012345678',
        bloodGroup: 'o_pos',
        facilityName: 'PHC Vom',
        passport: null,
      },
    ]);

    expect(html).toContain('PLASCHEMA - CBHI SECTOR');
    expect(html).toContain('MUSA IBRAHIM');
    expect(html).toContain("This card must be in owner's possession at all times");
    expect(html).toContain('Any alteration would render this card invalid.');
    expect(html).toContain('front-body');
    expect(html).toContain('align-items: center');
    expect(html).toContain('class="page"');
    expect(html.match(/class="page"/g)?.length).toBe(2);
  });

  it('rejects empty and oversized batches', () => {
    expect(() => buildIdCardSheetHtml([])).toThrow(/1–9/);
    expect(() =>
      buildIdCardSheetHtml(
        Array.from({ length: 10 }, (_, i) => ({
          enrollmentId: `PL/CBHI/2026/${i}`,
          fullName: `Person ${i}`,
          emergencyPhone: '08000000000',
          bloodGroup: 'unknown' as const,
          facilityName: 'PHC',
          passport: null,
        })),
      ),
    ).toThrow(/1–9/);
  });
});
