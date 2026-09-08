import sharp from 'sharp';

import {
  isPassportPrintSourceContentType,
  resizePassportForIdCard,
  PASSPORT_PRINT_HEIGHT,
  PASSPORT_PRINT_WIDTH,
} from './passport-print-image';

describe('passport-print-image', () => {
  it('accepts common raster image content types', () => {
    expect(isPassportPrintSourceContentType('image/jpeg')).toBe(true);
    expect(isPassportPrintSourceContentType('image/png')).toBe(true);
    expect(isPassportPrintSourceContentType('application/pdf')).toBe(false);
  });

  it('resizes a source image to the ID card print dimensions', async () => {
    const source = await sharp({
      create: {
        width: 2000,
        height: 3000,
        channels: 3,
        background: { r: 120, g: 80, b: 40 },
      },
    })
      .jpeg()
      .toBuffer();

    const resized = await resizePassportForIdCard(source);
    const metadata = await sharp(resized).metadata();

    expect(metadata.width).toBe(PASSPORT_PRINT_WIDTH);
    expect(metadata.height).toBe(PASSPORT_PRINT_HEIGHT);
    expect(metadata.format).toBe('jpeg');
    expect(resized.length).toBeLessThan(source.length);
  });
});
