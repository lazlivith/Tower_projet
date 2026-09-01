import prisma from '../../config/prisma.js';
import { storeFile } from '../storage.service.js';
import { nextNumber } from './numbering.js';
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
 * le dossier dédié, et une ligne `GeneratedDocument` est enregistrée (n° séquentiel).
 */

const CONFIG = {
  CERTIFICATE: { render: renderCertificate, scope: 'certificates', label: 'Certificat de réussite' },
  INVOICE: { render: renderInvoice, scope: 'invoices', label: 'Facture' },
  QUOTE: { render: renderQuote, scope: 'quotes', label: 'Devis' },
  ENROLLMENT_ATTESTATION: { render: renderAttestation, scope: 'attestations', label: "Attestation d'inscription" },
};

export const DOCUMENT_TYPES = Object.keys(CONFIG);

/**
 * @param {'CERTIFICATE'|'INVOICE'|'QUOTE'|'ENROLLMENT_ATTESTATION'} type
 * @param {object} data                 données propres au template (voir chaque template)
 * @param {object} [opts]
 * @param {string} [opts.title]         titre lisible (sinon dérivé)
 * @param {string} [opts.userId]        bénéficiaire (élève / destinataire)
 * @param {string} [opts.courseId]
 * @param {string} [opts.quoteId]
 * @param {string} [opts.paymentId]
 * @param {object} [opts.meta]
 * @param {boolean} [opts.register=true] enregistre une ligne GeneratedDocument
 */
export async function generateDocument(type, data, opts = {}) {
  const conf = CONFIG[type];
  if (!conf) throw Object.assign(new Error(`Type de document inconnu : ${type}`), { status: 400 });

  const number = data.number || (await nextNumber(type));
  const bytes = await conf.render({ ...data, number });

  const asset = await storeFile({
    buffer: Buffer.from(bytes),
    originalname: `${number}.pdf`,
    kind: 'pdf',
    scope: conf.scope,
  });

  let record = null;
  if (opts.register !== false) {
    record = await prisma.generatedDocument.create({
      data: {
        type,
        number,
        title: opts.title || `${conf.label} — ${data.studentName || data.clientName || ''}`.trim(),
        url: asset.url,
        userId: opts.userId || null,
        courseId: opts.courseId || null,
        quoteId: opts.quoteId || null,
        paymentId: opts.paymentId || null,
        meta: opts.meta || undefined,
      },
    });
  }

  return { id: record?.id ?? null, type, number, url: asset.url, provider: asset.provider };
}
