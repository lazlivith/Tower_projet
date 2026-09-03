import { degrees, rgb } from 'pdf-lib';
import { createDoc, COLORS, clean, BRAND } from '../layout.js';

/**
 * Certificat de réussite — format paysage, composition décorative
 * (rubans d'angle marine/cyan, médaille dorée, cadre ambre) sur la palette
 * Tower Structure. Reprend la même signature `render(data)` que les autres
 * documents mais dessine sa propre page (les briques `layout.js` sont portrait).
 *
 * data : { number, studentName, courseTitle, score, hours?, verifyUrl?, qrPngBytes? }
 */

const PAGE = { w: 841.89, h: 595.28 };

export async function render(data) {
  const ctx = await createDoc();
  const { doc, font, bold } = ctx;
  const page = doc.addPage([PAGE.w, PAGE.h]);
  const { w: W, h: H } = PAGE;
  const CX = W / 2;

  const draw = (s, { x, y, size = 10, f = font, color = COLORS.ink, spacing = 0 }) =>
    page.drawText(clean(s), { x, y, size, font: f, color, characterSpacing: spacing });

  const widthOf = (s, size, f = font, spacing = 0) =>
    f.widthOfTextAtSize(clean(s), size) + spacing * Math.max(0, clean(s).length - 1);

  const centered = (s, { y, size = 10, f = font, color = COLORS.ink, spacing = 0 }) =>
    draw(s, { x: CX - widthOf(s, size, f, spacing) / 2, y, size, f, color, spacing });

  /* -------------------------------------------------- fond + rubans d'angle */
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: COLORS.white });

  // Filigrane discret
  page.drawText(clean(BRAND.name), {
    x: 90, y: 150, size: 46, font: bold, rotate: degrees(30),
    color: rgb(0.955, 0.965, 0.975),
  });

  // Rubans concentriques : marine puis cyan, en haut-gauche et bas-droite
  const ribbons = (cx, cy) => {
    page.drawCircle({ x: cx, y: cy, size: 182, color: COLORS.navy });
    page.drawCircle({ x: cx, y: cy, size: 156, color: COLORS.white });
    page.drawCircle({ x: cx, y: cy, size: 138, color: COLORS.cyan });
    page.drawCircle({ x: cx, y: cy, size: 116, color: COLORS.white });
  };
  ribbons(-34, H + 34);
  ribbons(W + 34, -34);

  /* --------------------------------------------------------------- cadres */
  page.drawRectangle({
    x: 22, y: 22, width: W - 44, height: H - 44,
    borderColor: COLORS.navy, borderWidth: 1.5,
  });
  page.drawRectangle({
    x: 30, y: 30, width: W - 60, height: H - 60,
    borderColor: COLORS.amber, borderWidth: 0.8,
  });

  /* -------------------------------------------------------------- médaille */
  const mx = 150;
  const my = H - 126;
  // rubans qui pendent sous la médaille
  page.drawRectangle({ x: mx - 3, y: my - 52, width: 9, height: 44, color: COLORS.navy, rotate: degrees(18) });
  page.drawRectangle({ x: mx + 3, y: my - 52, width: 9, height: 44, color: COLORS.amber, rotate: degrees(-18) });
  // disque doré (double anneau + cœur)
  page.drawCircle({ x: mx, y: my, size: 27, color: COLORS.amber });
  page.drawCircle({ x: mx, y: my, size: 27, borderColor: COLORS.amberDeep, borderWidth: 2 });
  page.drawCircle({ x: mx, y: my, size: 18, color: COLORS.white });
  page.drawCircle({ x: mx, y: my, size: 12, color: COLORS.amber });
  page.drawCircle({ x: mx, y: my, size: 12, borderColor: COLORS.amberDeep, borderWidth: 1 });
  page.drawText('TS', {
    x: mx - bold.widthOfTextAtSize('TS', 9) / 2, y: my - 3.2,
    size: 9, font: bold, color: COLORS.navy,
  });

  /* ---------------------------------------------------------------- titre */
  centered('CERTIFICAT', { y: H - 138, size: 46, f: bold, color: COLORS.navy, spacing: 3 });
  centered('DE RÉUSSITE', { y: H - 168, size: 14, color: COLORS.soft, spacing: 6 });

  // filet ambre + losanges
  const rule = 110;
  page.drawLine({ start: { x: CX - rule, y: H - 186 }, end: { x: CX + rule, y: H - 186 }, thickness: 1, color: COLORS.amber });
  [-rule, rule].forEach((dx) =>
    page.drawRectangle({ x: CX + dx - 3, y: H - 189, width: 6, height: 6, color: COLORS.amber, rotate: degrees(45) })
  );

  /* ----------------------------------------------------------- récipiendaire */
  centered('Ce certificat est fièrement décerné à', { y: H - 220, size: 11, color: COLORS.soft });

  let nameSize = 34;
  while (widthOf(data.studentName || '—', nameSize, bold) > W - 260 && nameSize > 18) nameSize -= 2;
  centered(data.studentName || '—', { y: H - 262, size: nameSize, f: bold, color: COLORS.navy });

  // trait sous le nom
  page.drawLine({ start: { x: CX - 150, y: H - 276 }, end: { x: CX + 150, y: H - 276 }, thickness: 0.8, color: COLORS.line });

  /* ------------------------------------------------------------ mention */
  const maxW = W - 300;
  const words = clean(`pour avoir suivi et validé avec succès la formation « ${data.courseTitle} ».`).split(/\s+/);
  let line = '';
  let y = H - 306;
  const flush = () => {
    if (!line) return;
    centered(line, { y, size: 12, color: COLORS.ink });
    y -= 18;
    line = '';
  };
  for (const wd of words) {
    const test = line ? `${line} ${wd}` : wd;
    if (font.widthOfTextAtSize(test, 12) > maxW) { flush(); line = wd; } else line = test;
  }
  flush();

  const scoreLine = data.hours != null
    ? `Note finale : ${data.score} %   ·   ${Math.round(data.hours)} h effectuées`
    : `Note finale : ${data.score} %`;
  centered(scoreLine, { y: y - 8, size: 12, f: bold, color: COLORS.ok });

  /* --------------------------------------------------------------- date */
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  centered(`Délivré le ${dateStr}`, { y: 150, size: 10, f: bold, color: COLORS.ink });

  /* ---------------------------------------------------- signature (droite) */
  const sx1 = CX + 70;
  const sx2 = W - 120;
  page.drawLine({ start: { x: sx1, y: 108 }, end: { x: sx2, y: 108 }, thickness: 1, color: COLORS.navy });
  const sigMid = (sx1 + sx2) / 2;
  draw('La Direction — Tower Structure', {
    x: sigMid - widthOf('La Direction — Tower Structure', 9, bold) / 2, y: 94, size: 9, f: bold, color: COLORS.ink,
  });
  draw('Organisme de formation BIM', {
    x: sigMid - widthOf('Organisme de formation BIM', 7.5) / 2, y: 84, size: 7.5, color: COLORS.faint,
  });

  /* ------------------------------------------------- vérification (gauche) */
  const qx = 120;
  const qy = 70;
  const qs = 48;
  if (data.qrPngBytes) {
    const qr = await doc.embedPng(data.qrPngBytes);
    page.drawImage(qr, { x: qx, y: qy, width: qs, height: qs });
  } else {
    page.drawRectangle({ x: qx, y: qy, width: qs, height: qs, borderColor: COLORS.line, borderWidth: 1 });
  }
  const tx = qx + qs + 12;
  draw(`Réf. ${data.number}`, { x: tx, y: qy + qs - 12, size: 8, f: bold, color: COLORS.navy });
  if (data.verifyUrl) draw(data.verifyUrl, { x: tx, y: qy + qs - 24, size: 7, color: COLORS.cyan });
  draw('Certificat vérifiable en ligne', { x: tx, y: qy + qs - 35, size: 7, color: COLORS.faint });

  return doc.save();
}
