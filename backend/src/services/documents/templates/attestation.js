import {
  createDoc, addPage, brandHeader, footer, paragraph, kvTable, gap, hr,
  signatureBlock, text, COLORS,
} from '../layout.js';

/** data : { number, studentName, courseTitle, durationHours?, level?, classroom?, startedAt?, status } */
export async function render(data) {
  const ctx = await createDoc();
  const cur = addPage(ctx);
  brandHeader(cur, { docLabel: "Attestation", number: data.number });

  text(cur, "ATTESTATION D'INSCRIPTION", { size: 15, font: ctx.bold, color: COLORS.navy });
  gap(cur, 26);

  paragraph(cur, "Nous soussignés, Tower Structure, bureau d'études structure et centre de formation BIM, attestons par la présente que :", { size: 11, color: COLORS.ink, lineGap: 5 });
  gap(cur, 10);

  kvTable(cur, [
    ['Nom du participant', data.studentName],
    ['Formation', data.courseTitle],
    ...(data.level ? [['Niveau', data.level]] : []),
    ...(data.durationHours ? [['Durée', `${data.durationHours} heures`]] : []),
    ...(data.classroom ? [['Groupe / classe', data.classroom]] : []),
    ['Date d\'inscription', data.startedAt ? new Date(data.startedAt).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')],
    ['Statut de l\'accès', data.status === 'ACTIVE' ? 'Actif' : data.status === 'COMPLETED' ? 'Terminé' : 'En attente'],
  ]);

  hr(cur);
  paragraph(cur, "Est régulièrement inscrit(e) à la formation susmentionnée dispensée par Tower Structure. La présente attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.", { size: 10, color: COLORS.ink, lineGap: 5 });

  gap(cur, 10);
  text(cur, `Référence : ${data.number}`, { size: 9, color: COLORS.soft });

  signatureBlock(cur, { name: 'La Direction — Tower Structure' });
  footer(cur, { note: 'Attestation d\'inscription — Tower Structure · Casablanca' });
  return ctx.doc.save();
}
