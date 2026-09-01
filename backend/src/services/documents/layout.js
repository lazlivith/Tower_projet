import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * Briques de mise en page A4 partagees par tous les documents PDF Tower Structure.
 * (certificat, facture, devis, attestation)
 */

export const A4 = { w: 595.28, h: 841.89 };
export const MARGIN = 50;

export const COLORS = {
  navy: rgb(0.039, 0.141, 0.212), // #0A2436
  ink: rgb(0.10, 0.12, 0.16),
  soft: rgb(0.42, 0.47, 0.52),
  line: rgb(0.85, 0.87, 0.90),
  amber: rgb(0.96, 0.62, 0.04), // #F59E0B
  accent: rgb(0.22, 0.74, 0.97), // #38BDF8
  ok: rgb(0.10, 0.55, 0.25),
  white: rgb(1, 1, 1),
};

/** Remplace les caracteres que la police standard (WinAnsi) ne sait pas encoder. */
export const clean = (s) =>
  String(s ?? '')
    .replace(/[    ⁠]/g, ' ') // espaces insecables / fines
    .replace(/[‐‑]/g, '-')
    .replace(/…/g, '...')
    .replace(/[‘’‚]/g, "'")
    .replace(/[“”]/g, '"');

export async function createDoc() {
  const doc = await PDFDocument.create();
  doc.setCreator('Tower Structure');
  doc.setProducer('Tower Structure - generateur de documents');
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const oblique = await doc.embedFont(StandardFonts.HelveticaOblique);
  return { doc, font, bold, oblique };
}

/** Ajoute une page A4 et renvoie un curseur de rendu. */
export function addPage(ctx) {
  const page = ctx.doc.addPage([A4.w, A4.h]);
  return { page, x: MARGIN, y: A4.h - MARGIN, ctx };
}

export function text(cur, str, { size = 11, font, color = COLORS.ink, x, y } = {}) {
  const f = font || cur.ctx.font;
  cur.page.drawText(clean(str), { x: x ?? cur.x, y: y ?? cur.y, size, font: f, color });
}

/** Texte centre horizontalement. */
export function centered(cur, str, { size = 12, font, color = COLORS.ink, y } = {}) {
  const f = font || cur.ctx.font;
  const s = clean(str);
  const width = f.widthOfTextAtSize(s, size);
  cur.page.drawText(s, { x: (A4.w - width) / 2, y: y ?? cur.y, size, font: f, color });
}

/** Paragraphe avec retour a la ligne automatique ; avance le curseur. */
export function paragraph(cur, str, { size = 11, font, color = COLORS.ink, lineGap = 4, width } = {}) {
  const f = font || cur.ctx.font;
  const maxW = width ?? A4.w - 2 * MARGIN;
  const words = clean(str).split(/\s+/);
  let line = '';
  const flush = () => {
    if (!line) return;
    cur.page.drawText(line, { x: cur.x, y: cur.y, size, font: f, color });
    cur.y -= size + lineGap;
    line = '';
  };
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (f.widthOfTextAtSize(test, size) > maxW) { flush(); line = w; }
    else line = test;
  }
  flush();
  return cur;
}

export function hr(cur, { color = COLORS.line, gap = 12 } = {}) {
  cur.y -= gap;
  cur.page.drawLine({ start: { x: MARGIN, y: cur.y }, end: { x: A4.w - MARGIN, y: cur.y }, thickness: 1, color });
  cur.y -= gap;
}

export function gap(cur, n = 14) { cur.y -= n; }

/** En-tete de marque : bandeau + logotype texte + coordonnees. */
export function brandHeader(cur, { docLabel, number } = {}) {
  const { page, ctx } = cur;
  page.drawRectangle({ x: 0, y: A4.h - 90, width: A4.w, height: 90, color: COLORS.navy });
  page.drawText('TOWER STRUCTURE', { x: MARGIN, y: A4.h - 45, size: 18, font: ctx.bold, color: COLORS.white });
  page.drawText(clean("Bureau d'etudes structure - Centre de formation BIM"), { x: MARGIN, y: A4.h - 62, size: 9, font: ctx.font, color: rgb(0.75, 0.82, 0.88) });
  page.drawText('Casablanca - Maroc - contact@tower-structure.ma', { x: MARGIN, y: A4.h - 75, size: 9, font: ctx.font, color: rgb(0.75, 0.82, 0.88) });
  if (docLabel) {
    const t = clean(docLabel).toUpperCase();
    const w = ctx.bold.widthOfTextAtSize(t, 12);
    page.drawText(t, { x: A4.w - MARGIN - w, y: A4.h - 45, size: 12, font: ctx.bold, color: COLORS.amber });
  }
  if (number) {
    const w = ctx.font.widthOfTextAtSize(number, 9);
    page.drawText(String(number), { x: A4.w - MARGIN - w, y: A4.h - 62, size: 9, font: ctx.font, color: rgb(0.75, 0.82, 0.88) });
  }
  cur.y = A4.h - 120;
}

export function footer(cur, { note } = {}) {
  const { page, ctx } = cur;
  page.drawLine({ start: { x: MARGIN, y: 56 }, end: { x: A4.w - MARGIN, y: 56 }, thickness: 1, color: COLORS.line });
  const line1 = clean(note || 'Tower Structure - Eurocodes EC0-EC8 - RPS 2000 - BIM LOD 400');
  page.drawText(line1, { x: MARGIN, y: 42, size: 8, font: ctx.font, color: COLORS.soft });
  const gen = `Document genere le ${new Date().toLocaleDateString('fr-FR')}`;
  const w = ctx.font.widthOfTextAtSize(gen, 8);
  page.drawText(gen, { x: A4.w - MARGIN - w, y: 42, size: 8, font: ctx.font, color: COLORS.soft });
}

/** Tableau cle / valeur (2 colonnes). Avance le curseur. */
export function kvTable(cur, rows, { labelW = 170, rowH = 22 } = {}) {
  const { page, ctx } = cur;
  for (const [k, v] of rows) {
    page.drawText(clean(k), { x: MARGIN, y: cur.y, size: 10, font: ctx.bold, color: COLORS.soft });
    page.drawText(clean(v ?? '-'), { x: MARGIN + labelW, y: cur.y, size: 10, font: ctx.font, color: COLORS.ink });
    cur.y -= rowH;
  }
}

/** Grand encadre de montant (facture / devis). */
export function amountBox(cur, { label, value }) {
  const { page, ctx } = cur;
  const boxY = cur.y - 46;
  page.drawRectangle({ x: MARGIN, y: boxY, width: A4.w - 2 * MARGIN, height: 46, color: rgb(0.97, 0.98, 1) });
  page.drawRectangle({ x: MARGIN, y: boxY, width: 4, height: 46, color: COLORS.amber });
  page.drawText(clean(label), { x: MARGIN + 16, y: boxY + 27, size: 9, font: ctx.bold, color: COLORS.soft });
  page.drawText(clean(value), { x: MARGIN + 16, y: boxY + 10, size: 16, font: ctx.bold, color: COLORS.navy });
  cur.y = boxY - 16;
}

export function signatureBlock(cur, { name = 'La Direction - Tower Structure' } = {}) {
  const { page, ctx } = cur;
  const y = Math.max(cur.y, 130);
  page.drawText(clean('Fait a Casablanca, le ' + new Date().toLocaleDateString('fr-FR')), { x: MARGIN, y, size: 9, font: ctx.font, color: COLORS.soft });
  page.drawLine({ start: { x: A4.w - MARGIN - 180, y: y - 34 }, end: { x: A4.w - MARGIN, y: y - 34 }, thickness: 1, color: COLORS.line });
  page.drawText(clean(name), { x: A4.w - MARGIN - 180, y: y - 48, size: 9, font: ctx.font, color: COLORS.soft });
  cur.y = y - 60;
}

export const money = (n, currency = 'MAD') =>
  `${Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 }).replace(/[  ]/g, ' ')} ${currency}`;
