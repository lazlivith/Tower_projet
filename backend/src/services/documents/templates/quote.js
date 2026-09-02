import {
  createDoc, addPage, brandHeader, footer, kvTable, amountBox, paragraph, gap,
  sectionLabel, signatureBlock, verificationRow, text, money, BRAND, COLORS, T,
} from '../layout.js';

/** data : { number, clientName, clientEmail, serviceType, description, amount?, currency?, validUntil?, verifyUrl?, qrPngBytes? } */
export async function render(data) {
  const ctx = await createDoc();
  const cur = addPage(ctx);

  brandHeader(cur, { docLabel: 'Devis', number: data.number });
  const qrPng = data.qrPngBytes ? await ctx.doc.embedPng(data.qrPngBytes) : null;

  text(cur, 'DEVIS', { size: T.h2, font: ctx.bold, color: COLORS.navy });
  gap(cur, 22);

  sectionLabel(cur, 'Émetteur');
  paragraph(cur, `${BRAND.name} — ${BRAND.tagline}. ${BRAND.contact}`, { size: T.small, color: COLORS.soft, lineGap: 4 });
  gap(cur, 14);

  sectionLabel(cur, 'Destinataire');
  kvTable(cur, [
    ['Client', data.clientName],
    ['Email', data.clientEmail || '—'],
    ['Date', new Date().toLocaleDateString('fr-FR')],
    ['Valable jusqu\'au', data.validUntil ? new Date(data.validUntil).toLocaleDateString('fr-FR') : '30 jours à compter de l\'émission'],
    ['Nature de la prestation', data.serviceType],
  ]);
  gap(cur, 12);

  sectionLabel(cur, 'Description');
  paragraph(cur, data.description || '—', { size: T.small, color: COLORS.ink, lineGap: 5 });
  gap(cur, 12);

  amountBox(cur, {
    label: 'Montant estimé (HT)',
    value: data.amount != null ? money(data.amount, data.currency || 'MAD') : 'Sur étude',
    sub: data.amount != null ? 'Hors taxes, hors frais de déplacement.' : 'Montant communiqué après étude technique.',
  });

  gap(cur, 6);
  paragraph(cur, "Estimation indicative. Le montant définitif est arrêté après étude technique détaillée et visite éventuelle du site. Bon pour accord : signature du client précédée de la mention manuscrite « Lu et approuvé ».", { size: T.tiny, color: COLORS.faint });

  signatureBlock(cur, { name: "Bureau d'études — Tower Structure" });
  verificationRow(cur, { number: data.number, verifyUrl: data.verifyUrl, qrPng });
  footer(cur, { note: `${BRAND.name} — devis sans engagement` });
  return ctx.doc.save();
}
