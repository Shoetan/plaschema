import fs from 'node:fs';
import path from 'node:path';
import type { BloodGroup } from '../domain/enrollment';

export type IdCardRenderInput = {
  enrollmentId: string;
  fullName: string;
  emergencyPhone: string | null;
  bloodGroup: BloodGroup | null;
  facilityName: string;
  passport: Buffer | null;
};

type PreparedCard = {
  enrollmentId: string;
  fullName: string;
  emergencyPhone: string;
  bloodGroupLabel: string;
  facilityName: string;
  passportDataUri: string | null;
};

const GREEN = '#1B5E20';

function bloodGroupLabel(value: BloodGroup | null): string {
  switch (value) {
    case 'a_pos':
      return 'A+';
    case 'a_neg':
      return 'A-';
    case 'b_pos':
      return 'B+';
    case 'b_neg':
      return 'B-';
    case 'ab_pos':
      return 'AB+';
    case 'ab_neg':
      return 'AB-';
    case 'o_pos':
      return 'O+';
    case 'o_neg':
      return 'O-';
    case 'unknown':
      return 'Not Sure';
    default:
      return 'Not Sure';
  }
}

function mimeFromBuffer(buf: Buffer): string {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return 'image/png';
  }
  if (
    buf.length >= 4 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46
  ) {
    return 'image/webp';
  }
  return 'image/jpeg';
}

function toDataUri(buf: Buffer, mime?: string): string {
  return `data:${mime ?? mimeFromBuffer(buf)};base64,${buf.toString('base64')}`;
}

function readAsset(filename: string): Buffer {
  const candidates = [
    path.join(process.cwd(), 'assets', 'id-card', filename),
    path.join(__dirname, '..', '..', '..', '..', 'assets', 'id-card', filename),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate);
    }
  }
  throw new Error(`ID card asset missing: ${filename}`);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function prepareCards(cards: IdCardRenderInput[]): PreparedCard[] {
  return cards.map((card) => ({
    enrollmentId: card.enrollmentId,
    fullName: card.fullName.toUpperCase(),
    emergencyPhone: card.emergencyPhone?.trim() || '—',
    bloodGroupLabel: bloodGroupLabel(card.bloodGroup),
    facilityName: card.facilityName.toUpperCase(),
    passportDataUri: card.passport ? toDataUri(card.passport) : null,
  }));
}

function frontCardHtml(card: PreparedCard | undefined, brand: BrandUris): string {
  if (!card) {
    return `<article class="card empty"></article>`;
  }

  const photo = card.passportDataUri
    ? `<img class="photo" src="${card.passportDataUri}" alt="" />`
    : `<div class="photo photo-placeholder">PHOTO</div>`;

  return `
<article class="card front">
  <header class="front-header">
    <img class="seal" src="${brand.seal}" alt="" />
    <div class="front-titles">
      <p class="agency">PLATEAU STATE<br/>CONTRIBUTORY<br/>HEALTHCARE<br/>MANAGEMENT AGENCY</p>
      <p class="sector">PLASCHEMA - CBHI SECTOR</p>
    </div>
    <img class="agency-logo" src="${brand.logo}" alt="" />
  </header>
  <div class="divider"></div>
  <section class="front-body">
    <div class="identity">
      ${photo}
      <div class="details">
        <p class="name">${escapeHtml(card.fullName)}</p>
        <p class="field"><span class="label">NOK Phone:</span><span class="value">${escapeHtml(card.emergencyPhone)}</span></p>
        <p class="field"><span class="label">Enrollment ID:</span><span class="value">${escapeHtml(card.enrollmentId)}</span></p>
        <p class="field inline"><span class="label">Blood Group:</span> <span class="value">${escapeHtml(card.bloodGroupLabel)}</span></p>
        <p class="field"><span class="label">Facility of Choice:</span><span class="value">${escapeHtml(card.facilityName)}</span></p>
      </div>
    </div>
  </section>
</article>`;
}

function backCardHtml(card: PreparedCard | undefined, brand: BrandUris): string {
  if (!card) {
    return `<article class="card empty"></article>`;
  }

  return `
<article class="card back">
  <header class="back-header">
    <div class="back-logos">
      <img class="seal" src="${brand.seal}" alt="" />
      <img class="agency-logo" src="${brand.logo}" alt="" />
    </div>
    <p class="back-title">PLASCHEMA - CBHI<br/>SECTOR ID CARD</p>
  </header>
  <div class="divider"></div>
  <section class="back-body">
    <p class="notice bold">This card must be in owner's possession at all times</p>
    <p class="notice">If found please return to 2nd Floor, Former Tati Hotel, Opposite Gada Biu Park, Jos, Plateau State, Nigeria or call 0700 700 1111</p>
    <p class="notice bold">Any alteration would render this card invalid.</p>
  </section>
  <footer class="back-footer">
    <img class="signature" src="${brand.signature}" alt="" />
  </footer>
</article>`;
}

type BrandUris = {
  seal: string;
  logo: string;
  signature: string;
};

function loadBrandUris(): BrandUris {
  return {
    seal: toDataUri(readAsset('plateau-seal.jpg'), 'image/jpeg'),
    logo: toDataUri(readAsset('plaschema-logo.png'), 'image/png'),
    signature: toDataUri(readAsset('signature.png'), 'image/png'),
  };
}

function sheetCss(): string {
  return `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
  width: 210mm;
  background: #fff;
  color: #111;
  font-family: Arial, Helvetica, sans-serif;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.page {
  width: 210mm;
  height: 297mm;
  padding: 6mm;
  page-break-after: always;
  break-after: page;
}
.page:last-child { page-break-after: auto; break-after: auto; }
.grid {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 3.5mm;
}
.card {
  border: 0.35mm solid #222;
  border-radius: 2.2mm;
  background: #fff;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 2.4mm;
}
.card.front {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  align-content: stretch;
}
.card.empty { visibility: hidden; }
.divider {
  height: 0;
  border-top: 0.28mm solid #9ca3af;
  margin: 1.4mm 0 0;
}
.seal { width: 11.5mm; height: 11.5mm; object-fit: contain; }
.agency-logo { width: 12mm; height: 12mm; object-fit: contain; }

/* FRONT */
.front-header {
  display: grid;
  grid-template-columns: 12mm 1fr 12mm;
  align-items: start;
  column-gap: 1mm;
}
.front-titles { text-align: center; padding-top: 0.2mm; }
.agency {
  margin: 0;
  color: ${GREEN};
  font-weight: 700;
  font-size: 5.1pt;
  line-height: 1.12;
  letter-spacing: 0.01em;
}
.sector {
  margin: 1.1mm 0 0;
  color: ${GREEN};
  font-weight: 700;
  font-size: 5.4pt;
  line-height: 1.1;
}
.front-body {
  min-height: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2mm 0.5mm 3mm;
}
.identity {
  display: grid;
  grid-template-columns: 16mm 1fr;
  column-gap: 2mm;
  width: 100%;
  align-items: start;
}
.photo {
  width: 16mm;
  height: 20mm;
  object-fit: cover;
  border: 0.2mm solid #bdbdbd;
  background: #f3f4f6;
}
.photo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 5pt;
  font-weight: 700;
}
.details { min-width: 0; }
.name {
  margin: 0 0 1.4mm;
  font-size: 7.2pt;
  font-weight: 700;
  line-height: 1.1;
  text-transform: uppercase;
}
.field {
  margin: 0 0 1.15mm;
  font-size: 5.1pt;
  line-height: 1.15;
}
.field .label { display: block; font-weight: 400; }
.field .value { display: block; font-weight: 700; word-break: break-word; }
.field.inline .label,
.field.inline .value { display: inline; }

.card.back {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
}
/* BACK */
.back-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5mm;
}
.back-logos {
  display: flex;
  align-items: center;
  gap: 1.2mm;
}
.back-title {
  margin: 0;
  text-align: right;
  color: ${GREEN};
  font-weight: 700;
  font-size: 6.2pt;
  line-height: 1.12;
}
.back-body {
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2.4mm;
  padding: 1mm 0.8mm;
  text-align: center;
}
.notice {
  margin: 0;
  font-size: 9.2pt;
  line-height: 1.48;
  color: #111;
}
.notice.bold { font-weight: 700; }
.back-footer {
  padding-top: 1mm;
  width: 55%;
}
.signature {
  display: block;
  width: 100%;
  max-height: 9mm;
  object-fit: contain;
  object-position: left bottom;
}
.sign-lines {
  margin-top: 0.4mm;
  border-top: 0.35mm solid #111;
  box-shadow: 0 0.55mm 0 0 #111;
  height: 0.55mm;
}
`;
}

/**
 * Builds the printable HTML for a 9-up A4 sheet (front page + back page).
 */
export function buildIdCardSheetHtml(cards: IdCardRenderInput[]): string {
  if (cards.length < 1 || cards.length > 9) {
    throw new Error('ID card sheet requires 1–9 cards');
  }

  const brand = loadBrandUris();
  const prepared = prepareCards(cards);
  const slots = Array.from({ length: 9 }, (_, i) => prepared[i]);

  const fronts = slots.map((card) => frontCardHtml(card, brand)).join('\n');
  const backs = slots.map((card) => backCardHtml(card, brand)).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>PLASCHEMA ID Cards</title>
  <style>${sheetCss()}</style>
</head>
<body>
  <section class="page">
    <div class="grid">${fronts}</div>
  </section>
  <section class="page">
    <div class="grid">${backs}</div>
  </section>
</body>
</html>`;
}

export function enrollmentFullName(input: {
  firstName: string;
  middleName: string | null;
  lastName: string;
}): string {
  return [input.firstName, input.middleName, input.lastName]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(' ')
    .trim();
}
