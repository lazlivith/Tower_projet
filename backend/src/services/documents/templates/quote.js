import {
  createDoc, addPage, brandHeader, footer, kvTable, amountBox, paragraph, gap, hr,
  signatureBlock, text, money, COLORS,
} from '../layout.js';

/** data : { number, clientName, clientEmail, serviceType, description, amount?, currency?, validUntil? } */
export async function render(data) {
  const ctx = await createDoc();
  const cur = addPage(ctx);
  brandHeader(cur, { docLabel: 'Devis', number: data.number });

  text(cur, 'DEVIS', { size: 16, font: ctx.bold, color: COLORS.navy });
  gap(cur, 24);

  kvTable(cur, [
    ['Numéro de devis', data.number],
    ['Date', new Date().toLocaleDateString('fr-FR')],
    ['Valable jusqu\'au', data.validUntil ? new Date(data.validUntil).toLocaleDateString('fr-FR') : '30 jours'],
    ['Client', data.clientName],
    ['Email', data.clientEmail || '—'],
    ['Nature de la prestation', data.serviceType],
  ]);

  hr(cur);
  text(cur, 'Description', { size: 11, font: ctx.bold, color: COLORS.soft });
  gap(cur, 18);
  paragraph(cur, data.description || '—', { size: 10, color: COLORS.ink, lineGap: 5 });

  gap(cur, 10);
  amountBox(cur, {
    label: 'MONTANT ESTIMÉ (HT)',
    value: data.amount != null ? money(data.amount, data.currency || 'MAD') : 'Sur étude — à confirmer',
  });

  gap(cur, 8);
  paragraph(cur, "Ce devis est une estimation indicative. Le montant définitif sera arrêté après étude technique détaillée et visite éventuelle. Bon pour accord : signature du client précédée de la mention « Lu et approuvé ».", { size: 9, color: COLORS.soft });

  signatureBlock(cur, { name: 'Bureau d\'études — Tower Structure' });
  footer(cur);
  return ctx.doc.save();
}
