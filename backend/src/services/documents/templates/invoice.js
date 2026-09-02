import {
  createDoc, addPage, brandHeader, footer, kvTable, amountBox, paragraph, gap,
  sectionLabel, signatureBlock, verificationRow, text, money, BRAND, COLORS, T,
} from '../layout.js';

/** data : { number, clientName, clientEmail, courseTitle, amount, currency?, paymentMethod?, paidAt?, reference?, verifyUrl?, qrPngBytes? } */
export async function render(data) {
  const ctx = await createDoc();
  const cur = addPage(ctx);

  brandHeader(cur, { docLabel: 'Facture', number: data.number });
  const qrPng = data.qrPngBytes ? await ctx.doc.embedPng(data.qrPngBytes) : null;

  text(cur, 'FACTURE', { size: T.h2, font: ctx.bold, color: COLORS.navy });
  gap(cur, 22);

  sectionLabel(cur, 'Émetteur');
  paragraph(cur, `${BRAND.name} — ${BRAND.tagline}. ${BRAND.contact}`, { size: T.small, color: COLORS.soft, lineGap: 4 });
  gap(cur, 14);

  sectionLabel(cur, 'Facturé à');
  kvTable(cur, [
    ['Client', data.clientName],
    ['Email', data.clientEmail || '—'],
    ['Date d\'émission', new Date(data.paidAt || Date.now()).toLocaleDateString('fr-FR')],
    data.reference ? ['Référence dossier', data.reference] : null,
  ]);
  gap(cur, 12);

  sectionLabel(cur, 'Détail de la prestation');
  kvTable(cur, [
    ['Prestation', `Formation — ${data.courseTitle}`],
    ['Mode de règlement', data.paymentMethod || 'Carte bancaire (Stripe test)'],
    ['Statut', 'Payé'],
  ]);
  gap(cur, 8);

  amountBox(cur, {
    label: 'Montant réglé (TTC)',
    value: money(data.amount, data.currency || 'MAD'),
    sub: 'Aucun solde restant dû.',
  });

  gap(cur, 6);
  paragraph(cur, "TVA non applicable — article 293 B du CGI (le cas échéant). Facture établie en mode test ; vaut reçu de paiement.", { size: T.tiny, color: COLORS.faint });

  signatureBlock(cur, { name: 'Service comptabilité — Tower Structure' });
  verificationRow(cur, { number: data.number, verifyUrl: data.verifyUrl, qrPng });
  footer(cur);
  return ctx.doc.save();
}
