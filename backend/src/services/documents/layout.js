import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

/**
 * Briques de mise en page A4 partagées par tous les documents Tower Structure
 * (certificat · facture · devis · attestation).
 *
 * Police : famille Helvetica (StandardFonts, encodage WinAnsi — couvre le
 * français). L'intégration d'une police Unicode complète (noms non latins)
 * est un chantier séparé : ajouter `@pdf-lib/fontkit` + un .ttf, puis
 * `doc.registerFontkit(...)` / `doc.embedFont(bytes)` dans `createDoc()`.
 */

export const A4 = { w: 595.28, h: 841.89 };
export const MARGIN = 52;
const CONTENT_W = A4.w - 2 * MARGIN;

export const BRAND = {
  name: 'TOWER STRUCTURE',
  tagline: "Bureau d'études structure · Centre de formation BIM",
  contact: 'Casablanca — Maroc · contact@tower-structure.ma · +212 5 22 00 00 00',
  compliance: 'Eurocodes EC0–EC8 · RPS 2000 · BIM LOD 400',
};

export const COLORS = {
  navy: rgb(0.035, 0.129, 0.196),   // #0A2132
  ink: rgb(0.09, 0.11, 0.15),
  soft: rgb(0.44, 0.49, 0.55),
  faint: rgb(0.62, 0.66, 0.71),
  line: rgb(0.86, 0.88, 0.91),
  hair: rgb(0.92, 0.93, 0.95),
  amber: rgb(0.96, 0.62, 0.04),     // #F59E0B
  amberDeep: rgb(0.72, 0.42, 0.02),
  cyan: rgb(0.13, 0.55, 0.72),      // #2189B7 (lisible sur blanc)
  ok: rgb(0.09, 0.5, 0.24),
  panel: rgb(0.976, 0.984, 0.992),
  navyText: rgb(0.78, 0.85, 0.9),
  white: rgb(1, 1, 1),
};

/** Échelle typographique (points). */
export const T = { h1: 22, h2: 15, lead: 11, body: 10, small: 9, tiny: 7.5, label: 8 };

/** Remplace les caractères que WinAnsi ne sait pas encoder. */
export const clean = (s) =>
  String(s ?? '')
    .replace(/[    ⁠]/g, ' ')
    .replace(/[‐‑]/g, '-')
    .replace(/…/g, '...')
    .replace(/[‘’‚]/g, "'")
    .replace(/[“”]/g, '"');

export async function createDoc() {
  const doc = await PDFDocument.create();
  doc.setCreator('Tower Structure');
  doc.setProducer('Tower Structure — générateur de documents');
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const oblique = await doc.embedFont(StandardFonts.HelveticaOblique);
  return { doc, font, bold, oblique };
}

export function addPage(ctx) {
  const page = ctx.doc.addPage([A4.w, A4.h]);
  return { page, x: MARGIN, y: A4.h - MARGIN, ctx, w: CONTENT_W };
}

/* ---------------------------------------------------------------- primitives */

export function text(cur, str, { size = T.body, font, color = COLORS.ink, x, y } = {}) {
  cur.page.drawText(clean(str), { x: x ?? cur.x, y: y ?? cur.y, size, font: font || cur.ctx.font, color });
}

export function centered(cur, str, { size = T.body, font, color = COLORS.ink, y } = {}) {
  const f = font || cur.ctx.font;
  const s = clean(str);
  cur.page.drawText(s, { x: (A4.w - f.widthOfTextAtSize(s, size)) / 2, y: y ?? cur.y, size, font: f, color });
}

export function rightText(cur, str, { size = T.small, font, color = COLORS.soft, y, right = A4.w - MARGIN } = {}) {
  const f = font || cur.ctx.font;
  const s = clean(str);
  cur.page.drawText(s, { x: right - f.widthOfTextAtSize(s, size), y: y ?? cur.y, size, font: f, color });
}

export function paragraph(cur, str, { size = T.body, font, color = COLORS.ink, lineGap = 4.5, width } = {}) {
  const f = font || cur.ctx.font;
  const maxW = width ?? cur.w;
  let line = '';
  const flush = () => {
    if (!line) return;
    cur.page.drawText(line, { x: cur.x, y: cur.y, size, font: f, color });
    cur.y -= size + lineGap;
    line = '';
  };
  for (const w of clean(str).split(/\s+/)) {
    const test = line ? `${line} ${w}` : w;
    if (f.widthOfTextAtSize(test, size) > maxW) { flush(); line = w; } else line = test;
  }
  flush();
  return cur;
}

export function gap(cur, n = 14) { cur.y -= n; }

export function divider(cur, { gap: g = 14, color = COLORS.hair } = {}) {
  cur.y -= g;
  cur.page.drawLine({ start: { x: MARGIN, y: cur.y }, end: { x: A4.w - MARGIN, y: cur.y }, thickness: 1, color });
  cur.y -= g;
}

/** Étiquette de section : petites capitales + filet cyan court. */
export function sectionLabel(cur, str) {
  const { page, ctx } = cur;
  const s = clean(str).toUpperCase();
  page.drawText(s, { x: MARGIN, y: cur.y, size: T.label, font: ctx.bold, color: COLORS.cyan, characterSpacing: 1.4 });
  const tw = ctx.bold.widthOfTextAtSize(s, T.label) + 1.4 * (s.length - 1);
  page.drawLine({ start: { x: MARGIN + tw + 8, y: cur.y + 2.5 }, end: { x: A4.w - MARGIN, y: cur.y + 2.5 }, thickness: 1, color: COLORS.hair });
  cur.y -= 16;
}

/* ------------------------------------------------------------------- marque */

/** Monogramme vectoriel : carré ambre + « TS » marine. */
export function brandMark(page, ctx, { x, y, size = 30 }) {
  page.drawRectangle({ x, y, width: size, height: size, color: COLORS.amber });
  const s = size * 0.44;
  page.drawText('TS', {
    x: x + (size - ctx.bold.widthOfTextAtSize('TS', s)) / 2,
    y: y + (size - s) / 2 + s * 0.12,
    size: s, font: ctx.bold, color: COLORS.navy,
  });
}

/** En-tête : bandeau marine, monogramme, nom, tagline, contact + libellé/№ à droite. */
export function brandHeader(cur, { docLabel, number } = {}) {
  const { page, ctx } = cur;
  const H = 104;
  page.drawRectangle({ x: 0, y: A4.h - H, width: A4.w, height: H, color: COLORS.navy });
  page.drawRectangle({ x: 0, y: A4.h - H - 3, width: A4.w, height: 3, color: COLORS.amber });

  brandMark(page, ctx, { x: MARGIN, y: A4.h - 56, size: 30 });
  page.drawText(BRAND.name, { x: MARGIN + 42, y: A4.h - 43, size: 16, font: ctx.bold, color: COLORS.white, characterSpacing: 1 });
  page.drawText(clean(BRAND.tagline), { x: MARGIN + 42, y: A4.h - 57, size: T.tiny, font: ctx.font, color: COLORS.navyText });
  page.drawText(clean(BRAND.contact), { x: MARGIN, y: A4.h - 84, size: T.tiny, font: ctx.font, color: COLORS.navyText });

  if (docLabel) {
    const t = clean(docLabel).toUpperCase();
    const tw = ctx.bold.widthOfTextAtSize(t, 11);
    page.drawText(t, { x: A4.w - MARGIN - tw, y: A4.h - 43, size: 11, font: ctx.bold, color: COLORS.amber, characterSpacing: 1.5 });
    page.drawLine({ start: { x: A4.w - MARGIN - tw, y: A4.h - 48 }, end: { x: A4.w - MARGIN, y: A4.h - 48 }, thickness: 1, color: COLORS.amber });
  }
  if (number) {
    page.drawText(String(number), {
      x: A4.w - MARGIN - ctx.font.widthOfTextAtSize(String(number), T.tiny),
      y: A4.h - 60, size: T.tiny, font: ctx.font, color: COLORS.navyText,
    });
  }
  cur.y = A4.h - H - 34;
}

/* -------------------------------------------------------------------- blocs */

/** Tableau clé / valeur — libellé gras gris, valeur encre, filet fin par ligne. */
export function kvTable(cur, rows, { labelW = 168, rowH = 21 } = {}) {
  const { page, ctx } = cur;
  rows.filter(Boolean).forEach(([k, v], i) => {
    if (i > 0) page.drawLine({ start: { x: MARGIN, y: cur.y + rowH - 6 }, end: { x: A4.w - MARGIN, y: cur.y + rowH - 6 }, thickness: 0.6, color: COLORS.hair });
    page.drawText(clean(k), { x: MARGIN, y: cur.y, size: T.small, font: ctx.bold, color: COLORS.soft });
    page.drawText(clean(v ?? '—'), { x: MARGIN + labelW, y: cur.y, size: T.small, font: ctx.font, color: COLORS.ink });
    cur.y -= rowH;
  });
}

/** Encadré de montant (facture / devis). */
export function amountBox(cur, { label, value, sub }) {
  const { page, ctx } = cur;
  const h = sub ? 58 : 46;
  const boxY = cur.y - h;
  page.drawRectangle({ x: MARGIN, y: boxY, width: CONTENT_W, height: h, color: COLORS.panel, borderColor: COLORS.line, borderWidth: 1 });
  page.drawRectangle({ x: MARGIN, y: boxY, width: 4, height: h, color: COLORS.amber });
  page.drawText(clean(label).toUpperCase(), { x: MARGIN + 16, y: boxY + h - 17, size: T.label, font: ctx.bold, color: COLORS.soft, characterSpacing: 1 });
  page.drawText(clean(value), { x: MARGIN + 16, y: boxY + (sub ? 24 : 12), size: 16, font: ctx.bold, color: COLORS.navy });
  if (sub) page.drawText(clean(sub), { x: MARGIN + 16, y: boxY + 10, size: T.tiny, font: ctx.font, color: COLORS.soft });
  cur.y = boxY - 16;
}

export function signatureBlock(cur, { name = 'La Direction — Tower Structure', place = 'Casablanca' } = {}) {
  const { page, ctx } = cur;
  const y = Math.max(cur.y, 150);
  page.drawText(clean(`Fait à ${place}, le ${new Date().toLocaleDateString('fr-FR')}`), { x: MARGIN, y, size: T.small, font: ctx.font, color: COLORS.soft });
  const bx = A4.w - MARGIN - 190;
  page.drawText(clean(name), { x: bx, y, size: T.small, font: ctx.bold, color: COLORS.ink });
  page.drawText('Signature et cachet', { x: bx, y: y - 46, size: T.tiny, font: ctx.font, color: COLORS.faint });
  page.drawLine({ start: { x: bx, y: y - 34 }, end: { x: A4.w - MARGIN, y: y - 34 }, thickness: 1, color: COLORS.line });
  cur.y = y - 58;
}

/** Bloc de vérification : QR + n° + URL publique. */
export function verificationRow(cur, { number, verifyUrl, qrPng }) {
  const { page, ctx } = cur;
  const y = Math.max(cur.y, 92);
  const qr = 54;
  if (qrPng) {
    page.drawImage(qrPng, { x: MARGIN, y: y - qr, width: qr, height: qr });
  } else {
    page.drawRectangle({ x: MARGIN, y: y - qr, width: qr, height: qr, borderColor: COLORS.line, borderWidth: 1 });
  }
  const tx = MARGIN + qr + 14;
  page.drawText('AUTHENTICITÉ', { x: tx, y: y - 12, size: T.label, font: ctx.bold, color: COLORS.cyan, characterSpacing: 1.4 });
  page.drawText(clean(`Vérifiez ce document avec la référence ${number}`), { x: tx, y: y - 26, size: T.tiny, font: ctx.font, color: COLORS.soft });
  if (verifyUrl) page.drawText(clean(verifyUrl), { x: tx, y: y - 38, size: T.tiny, font: ctx.font, color: COLORS.cyan });
  cur.y = y - qr - 10;
}

export function footer(cur, { note } = {}) {
  const { page, ctx } = cur;
  page.drawLine({ start: { x: MARGIN, y: 52 }, end: { x: A4.w - MARGIN, y: 52 }, thickness: 1, color: COLORS.line });
  page.drawText(clean(note || `${BRAND.name} — ${BRAND.compliance}`), { x: MARGIN, y: 39, size: T.tiny, font: ctx.font, color: COLORS.faint });
  const gen = `Généré le ${new Date().toLocaleDateString('fr-FR')}`;
  page.drawText(clean(gen), { x: A4.w - MARGIN - ctx.font.widthOfTextAtSize(clean(gen), T.tiny), y: 39, size: T.tiny, font: ctx.font, color: COLORS.faint });
}

/* ------------------------------------------------------------- décorations */

export function watermark(page, ctx, str = BRAND.name) {
  const size = 58;
  const s = clean(str);
  page.drawText(s, {
    x: 96, y: 250, size, font: ctx.bold, rotate: degrees(38),
    color: rgb(0.95, 0.96, 0.97),
  });
}

/** Sceau : double anneau + texte centré (certificat). */
export function sealMark(page, ctx, { cx, cy, r = 34 }) {
  page.drawCircle({ x: cx, y: cy, size: r, borderColor: COLORS.amber, borderWidth: 1.4 });
  page.drawCircle({ x: cx, y: cy, size: r - 5, borderColor: COLORS.amber, borderWidth: 0.6 });
  const l1 = 'CERTIFIÉ', l2 = 'TOWER';
  page.drawText(clean(l1), { x: cx - ctx.bold.widthOfTextAtSize(l1, 7) / 2, y: cy + 1, size: 7, font: ctx.bold, color: COLORS.amberDeep, characterSpacing: 1 });
  page.drawText(l2, { x: cx - ctx.font.widthOfTextAtSize(l2, 6) / 2, y: cy - 9, size: 6, font: ctx.font, color: COLORS.amberDeep, characterSpacing: 1 });
}

export const money = (n, currency = 'MAD') =>
  `${Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 }).replace(/[  ]/g, ' ')} ${currency}`;
