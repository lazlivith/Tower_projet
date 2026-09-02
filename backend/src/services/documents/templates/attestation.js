import {
  createDoc, addPage, brandHeader, footer, kvTable, paragraph, gap,
  sectionLabel, signatureBlock, verificationRow, text, COLORS, T,
} from '../layout.js';

/** data : { number, studentName, courseTitle, durationHours?, level?, classroom?, startedAt?, status, verifyUrl?, qrPngBytes? } */
export async function render(data) {
  const ctx = await createDoc();
  const cur = addPage(ctx);

  brandHeader(cur, { docLabel: 'Attestation', number: data.number });
  const qrPng = data.qrPngBytes ? await ctx.doc.embedPng(data.qrPngBytes) : null;

  text(cur, "ATTESTATION D'INSCRIPTION", { size: T.h2, font: ctx.bold, color: COLORS.navy });
  gap(cur, 24);

  paragraph(cur, "Nous soussignés, Tower Structure, bureau d'études structure et centre de formation BIM, sis à Casablanca, attestons par la présente que :", { size: T.lead, color: COLORS.ink, lineGap: 5 });
  gap(cur, 14);

  sectionLabel(cur, 'Participant & formation');
  kvTable(cur, [
    ['Nom du participant', data.studentName],
    ['Formation', data.courseTitle],
    data.level ? ['Niveau', data.level] : null,
    data.durationHours ? ['Durée', `${data.durationHours} heures`] : null,
    data.classroom ? ['Groupe / classe', data.classroom] : null,
    ['Date d\'inscription', data.startedAt ? new Date(data.startedAt).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')],
    ['Statut de l\'accès', data.status === 'ACTIVE' ? 'Actif' : data.status === 'COMPLETED' ? 'Terminé' : 'En attente'],
  ]);
  gap(cur, 12);

  paragraph(cur, "Est régulièrement inscrit(e) à la formation susmentionnée dispensée par Tower Structure. La présente attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.", { size: T.small, color: COLORS.ink, lineGap: 5 });
  gap(cur, 8);
  text(cur, `Référence : ${data.number}`, { size: T.tiny, color: COLORS.faint });

  signatureBlock(cur, { name: 'La Direction — Tower Structure' });
  verificationRow(cur, { number: data.number, verifyUrl: data.verifyUrl, qrPng });
  footer(cur, { note: "Attestation d'inscription — Tower Structure · Casablanca" });
  return ctx.doc.save();
}
