import sharp from 'sharp';

/** ID card photo slot is 16mm × 20mm; 400×500 px is 2× print density. */
export const PASSPORT_PRINT_WIDTH = 400;
export const PASSPORT_PRINT_HEIGHT = 500;
export const PASSPORT_PRINT_JPEG_QUALITY = 80;

export function isPassportPrintSourceContentType(
  contentType: string | undefined,
): boolean {
  if (!contentType) {
    return true;
  }
  return (
    contentType.startsWith('image/') && contentType !== 'image/svg+xml'
  );
}

export async function resizePassportForIdCard(source: Buffer): Promise<Buffer> {
  return sharp(source)
    .rotate()
    .resize(PASSPORT_PRINT_WIDTH, PASSPORT_PRINT_HEIGHT, {
      fit: 'cover',
      position: 'centre',
    })
    .jpeg({ quality: PASSPORT_PRINT_JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
}
