import { createDoc, addPage, brandHeader, footer, centered, gap, COLORS, A4, MARGIN } from '../layout.js';

/** data : { number, studentName, courseTitle, score, hours? } */
export async function render(data) {
  const ctx = await createDoc();
  const cur = addPage(ctx);
  brandHeader(cur, { docLabel: 'Certificat', number: data.number });

  // cadre décoratif
  cur.page.drawRectangle({
    x: 28, y: 28, width: A4.w - 56, height: A4.h - 160,
    borderColor: COLORS.amber, borderWidth: 3,
  });

  cur.y = A4.h - 220;
  centered(cur, 'CERTIFICAT DE RÉUSSITE', { size: 26, font: ctx.bold, color: COLORS.navy });
  gap(cur, 46);
  centered(cur, 'Ce certificat atteste que', { size: 12, color: COLORS.soft });
  gap(cur, 40);
  centered(cur, data.studentName, { size: 24, font: ctx.bold, color: COLORS.ink });
  gap(cur, 40);
  centered(cur, 'a suivi et validé avec succès la formation', { size: 12, color: COLORS.soft });
  gap(cur, 34);
  centered(cur, `« ${data.courseTitle} »`, { size: 16, font: ctx.bold, color: COLORS.navy });
  gap(cur, 50);

  const line = data.hours != null
    ? `Note finale : ${data.score} %     ·     Heures effectuées : ${Math.round(data.hours)} h`
    : `Note finale : ${data.score} %`;
  centered(cur, line, { size: 12, font: ctx.bold, color: COLORS.ok });
  gap(cur, 60);
  centered(cur, `Délivré le ${new Date().toLocaleDateString('fr-FR')} — Réf. ${data.number}`, { size: 10, color: COLORS.soft });

  // bloc signature
  cur.page.drawLine({ start: { x: A4.w / 2 - 90, y: 150 }, end: { x: A4.w / 2 + 90, y: 150 }, thickness: 1, color: COLORS.line });
  centered(cur, 'La Direction — Tower Structure', { size: 9, color: COLORS.soft, y: 136 });

  footer(cur, { note: 'Certificat vérifiable auprès de Tower Structure — contact@tower-structure.ma' });
  return ctx.doc.save();
}
