import {
  createDoc, addPage, brandHeader, footer, kvTable, amountBox, paragraph, gap, hr,
  signatureBlock, text, money, COLORS,
} from '../layout.js';

/** data : { number, clientName, clientEmail, courseTitle, amount, currency?, paymentMethod?, paidAt?, reference? } */
export async function render(data) {
  const ctx = await createDoc();
  const cur = addPage(ctx);
  brandHeader(cur, { docLabel: 'Facture', number: data.number });

  text(cur, 'FACTURE', { size: 16, font: ctx.bold, color: COLORS.navy });
  gap(cur, 24);

  kvTable(cur, [
    ['Numéro de facture', data.number],
    ['Date', new Date(data.paidAt || Date.now()).toLocaleDateString('fr-FR')],
    ['Client', data.clientName],
    ['Email', data.clientEmail || '—'],
    ...(data.reference ? [['Référence dossier', data.reference]] : []),
  ]);

  hr(cur);
  text(cur, 'Détail', { size: 11, font: ctx.bold, color: COLORS.soft });
  gap(cur, 20);
  kvTable(cur, [
    ['Prestation', `Formation — ${data.courseTitle}`],
    ['Mode de règlement', data.paymentMethod || 'Carte bancaire (Stripe test)'],
    ['Statut', 'Payé'],
  ]);

  gap(cur, 6);
  amountBox(cur, { label: 'MONTANT RÉGLÉ (TTC)', value: money(data.amount, data.currency || 'MAD') });

  gap(cur, 8);
  paragraph(cur, "TVA non applicable — article 293 B (le cas échéant). Cette facture est établie en mode test et vaut reçu de paiement.", { size: 9, color: COLORS.soft });

  signatureBlock(cur, { name: 'Service comptabilité — Tower Structure' });
  footer(cur);
  return ctx.doc.save();
}
