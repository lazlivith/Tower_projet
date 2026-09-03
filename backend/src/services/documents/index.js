import prisma from '../../config/prisma.js';
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
 * Les octets du PDF sont stockés directement sur la ligne `GeneratedDocument`
 * (`content` BYTEA) et servis par `GET /api/documents/file/:number`. Aucun CDN
 * externe : Cloudinary bloque par défaut la livraison des PDF (HTTP 401) et ces
 * documents (devis, factures, certificats) n'ont pas vocation à être publics.
 *
 * - `data.number` fourni  → régénération : on **remplace** (upsert) le document du même numéro.
 * - `data.number` absent  → numéro attribué automatiquement ; en cas de collision
 *   (course concurrent), on retente avec un numéro frais.
 */

const CONFIG = {
  CERTIFICATE: { render: renderCertificate, label: 'Certificat de réussite' },
  INVOICE: { render: renderInvoice, label: 'Facture' },
  QUOTE: { render: renderQuote, label: 'Devis' },
  ENROLLMENT_ATTESTATION: { render: renderAttestation, label: "Attestation d'inscription" },
};

export const DOCUMENT_TYPES = Object.keys(CONFIG);

/** Chemin relatif de téléchargement (le front le passe par `toAbsoluteUrl`). */
export const fileUrlFor = (number) => `/api/documents/file/${encodeURIComponent(number)}`;

/** URL absolue — pour les liens envoyés hors application (e-mails). */
export const fileUrlAbsolute = (number) => {
  const base = (process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/+$/, '');
  return `${base}${fileUrlFor(number)}`;
};

export async function generateDocument(type, data, opts = {}) {
  const conf = CONFIG[type];
  if (!conf) throw Object.assign(new Error(`Type de document inconnu : ${type}`), { status: 400 });

  const explicitNumber = Boolean(data.number);
  let number = data.number || (await nextNumber(type));

  const render = async () => {
    const qrPngBytes = await verifyQrPng(number);
    const bytes = await conf.render({ ...data, number, verifyUrl: verifyUrlFor(number), qrPngBytes });
    return Buffer.from(bytes);
  };
  let content = await render();

  if (opts.register === false) {
    return { id: null, type, number, url: fileUrlFor(number), provider: 'db' };
  }

  const baseData = () => ({
    type,
    number,
    title: opts.title || `${conf.label} — ${data.studentName || data.clientName || ''}`.trim(),
    url: fileUrlFor(number),
    userId: opts.userId || null,
    courseId: opts.courseId || null,
    quoteId: opts.quoteId || null,
    paymentId: opts.paymentId || null,
    meta: opts.meta || undefined,
    content,
  });

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const record = explicitNumber
        ? await prisma.generatedDocument.upsert({
            where: { number },
            update: { url: fileUrlFor(number), title: baseData().title, meta: opts.meta || undefined, content },
            create: baseData(),
          })
        : await prisma.generatedDocument.create({ data: baseData() });
      return { id: record.id, type, number, url: record.url, provider: 'db' };
    } catch (e) {
      if (e?.code !== 'P2002' || explicitNumber) throw e;
      number = await nextNumber(type); // collision de numéro auto → on régénère
      content = await render();
    }
  }
  throw new Error("Impossible d'attribuer un numéro de document unique.");
}
