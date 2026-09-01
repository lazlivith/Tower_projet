import prisma from '../../config/prisma.js';

const PREFIX = {
  CERTIFICATE: 'TS-CERT',
  INVOICE: 'TS-FAC',
  QUOTE: 'TS-DEV',
  ENROLLMENT_ATTESTATION: 'TS-ATT',
};

/**
 * Numéro séquentiel par type et par année : ex. TS-FAC-2026-0042.
 *
 * La base du compteur est le plus grand numéro déjà attribué cette année,
 * en tenant compte à la fois du registre `GeneratedDocument` ET, pour les
 * devis, de la colonne `quotes.reference` (qui peut survivre à la purge du
 * registre). On repart donc toujours de max(...) + 1 → jamais de collision.
 */
export async function nextNumber(type) {
  const prefix = PREFIX[type] || 'TS-DOC';
  const year = new Date().getFullYear();
  const re = new RegExp(`^${prefix}-${year}-(\\d+)$`);

  const numbers = [];

  const docs = await prisma.generatedDocument.findMany({
    where: { type, number: { startsWith: `${prefix}-${year}-` } },
    select: { number: true },
  });
  numbers.push(...docs.map((d) => d.number));

  if (type === 'QUOTE') {
    const quotes = await prisma.quote.findMany({
      where: { reference: { startsWith: `${prefix}-${year}-` } },
      select: { reference: true },
    });
    numbers.push(...quotes.map((q) => q.reference));
  }

  let max = 0;
  for (const n of numbers) {
    const m = re.exec(n || '');
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}-${year}-${String(max + 1).padStart(4, '0')}`;
}
