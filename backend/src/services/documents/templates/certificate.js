import {
  createDoc, addPage, brandHeader, footer, centered, gap, watermark, sealMark,
  verificationRow, COLORS, T, A4, MARGIN,
} from '../layout.js';

/** data : { number, studentName, courseTitle, score, hours?, verifyUrl?, qrPngBytes? } */
export async function render(data) {
  const ctx = await createDoc();
  const cur = addPage(ctx);
  const { page } = cur;

  watermark(page, ctx);
  brandHeader(cur, { docLabel: 'Certificat', number: data.number });

  // liseré ambre intérieur
  page.drawRectangle({
    x: 26, y: 108, width: A4.w - 52, height: A4.h - 108 - 118,
    borderColor: COLORS.amber, borderWidth: 2.5,
  });

  const qrPng = data.qrPngBytes ? await ctx.doc.embedPng(data.qrPngBytes) : null;

  cur.y = A4.h - 208;
  centered(cur, 'CERTIFICAT DE RÉUSSITE', { size: T.h1, font: ctx.bold, color: COLORS.navy });
  gap(cur, 12);
  centered(cur, '— formation professionnelle —', { size: T.small, color: COLORS.faint });
  gap(cur, 44);

  centered(cur, 'Ce certificat atteste que', { size: T.lead, color: COLORS.soft });
  gap(cur, 42);
  centered(cur, data.studentName, { size: 25, font: ctx.bold, color: COLORS.ink });
  gap(cur, 22);
  page.drawLine({ start: { x: A4.w / 2 - 70, y: cur.y }, end: { x: A4.w / 2 + 70, y: cur.y }, thickness: 1, color: COLORS.amber });
  gap(cur, 26);

  centered(cur, 'a suivi et validé avec succès la formation', { size: T.lead, color: COLORS.soft });
  gap(cur, 32);
  centered(cur, `« ${data.courseTitle} »`, { size: T.h2, font: ctx.bold, color: COLORS.navy });
  gap(cur, 46);

  const line = data.hours != null
    ? `Note finale : ${data.score} %      ·      Heures effectuées : ${Math.round(data.hours)} h`
    : `Note finale : ${data.score} %`;
  centered(cur, line, { size: T.lead, font: ctx.bold, color: COLORS.ok });
  gap(cur, 30);
  centered(cur, `Délivré le ${new Date().toLocaleDateString('fr-FR')} — Réf. ${data.number}`, { size: T.small, color: COLORS.soft });

  // sceau + signature
  sealMark(page, ctx, { cx: A4.w / 2 - 130, cy: 190, r: 32 });
  page.drawLine({ start: { x: A4.w / 2 + 20, y: 178 }, end: { x: A4.w / 2 + 170, y: 178 }, thickness: 1, color: COLORS.line });
  centered(cur, 'La Direction — Tower Structure', { size: T.tiny, color: COLORS.faint, y: 164 });

  cur.y = 150;
  verificationRow(cur, { number: data.number, verifyUrl: data.verifyUrl, qrPng });

  footer(cur, { note: 'Certificat vérifiable en ligne · contact@tower-structure.ma' });
  return ctx.doc.save();
}
