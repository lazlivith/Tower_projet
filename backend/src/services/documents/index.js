import prisma from '../../config/prisma.js';
import { storeFile } from '../storage.service.js';
import { nextNumber } from './numbering.js';
import { verifyUrlFor, verifyQrPng } from './verify.js';
import { render as renderCertificate } from './templates/certificate.js';
import { render as renderInvoice } from './templates/invoice.js';
import { render as renderQuote } from './templates/quote.js';
import { render as renderAttestation } from './templates/attestation.js';

/**
 * Générateur de documents PDF — un composant par type, un point d'entrée unique.
 *
 *   const { url, number } = await generateDocument('INVOICE', { ... });
 *
 * Le PDF est poussé via `storeFile` (Cloudinary si configuré, sinon disque) dans
 * le dossier dédié, et une ligne `GeneratedDocument` est enregistrée.
 *
 * - `data.number` fourni  → régénération : on **remplace** (upsert) le document du même numéro.
 * - `data.number` absent  → numéro attribué automatiquement ; en cas de collision
 *   (course concurrent), on retente avec un numéro frais.
 */

const CONFIG = {
  CERTIFICATE: { render: renderCertificate, scope: 'certificates', label: 'Certificat de réussite' },
  INVOICE: { render: renderInvoice, scope: 'invoices', label: 'Facture' },
  QUOTE: { render: renderQuote, scope: 'quotes', label: 'Devis' },
  ENROLLMENT_ATTESTATION: { render: renderAttestation, scope: 'attestations', label: "Attestation d'inscription" },
};

export const DOCUMENT_TYPES = Object.keys(CONFIG);

export async function generateDocument(type, data, opts = {}) {
  const conf = CONFIG[type];
  if (!conf) throw Object.assign(new Error(`Type de document inconnu : ${type}`), { status: 400 });

  const explicitNumber = Boolean(data.number);
  let number = data.number || (await nextNumber(type));

  const buildAsset = async () => {
    const qrPngBytes = await verifyQrPng(number);
    const bytes = await conf.render({ ...data, number, verifyUrl: verifyUrlFor(number), qrPngBytes });
    return storeFile({ buffer: Buffer.from(bytes), originalname: `${number}.pdf`, kind: 'pdf', scope: conf.scope });
  };

  let asset = await buildAsset();

  if (opts.register === false) {
    return { id: null, type, number, url: asset.url, provider: asset.provider };
  }

  const baseData = () => ({
    type,
    number,
    title: opts.title || `${conf.label} — ${data.studentName || data.clientName || ''}`.trim(),
    url: asset.url,
    userId: opts.userId || null,
    courseId: opts.courseId || null,
    quoteId: opts.quoteId || null,
    paymentId: opts.paymentId || null,
    meta: opts.meta || undefined,
  });

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const record = explicitNumber
        ? await prisma.generatedDocument.upsert({
            where: { number },
            update: { url: asset.url, title: baseData().title, meta: opts.meta || undefined },
            create: baseData(),
          })
        : await prisma.generatedDocument.create({ data: baseData() });
      return { id: record.id, type, number, url: asset.url, provider: asset.provider };
    } catch (e) {
      if (e?.code !== 'P2002' || explicitNumber) throw e;
      number = await nextNumber(type); // collision de numéro auto → on régénère
      asset = await buildAsset();
    }
  }
  throw new Error("Impossible d'attribuer un numéro de document unique.");
}
