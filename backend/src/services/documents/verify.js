import QRCode from 'qrcode';

/**
 * URL publique de vérification d'un document par sa référence.
 * Ex. https://tower-structure.ma/verify/TS-CERT-2026-0007
 */
export const verifyUrlFor = (number) =>
  `${(process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim()}/verify/${encodeURIComponent(number)}`;

/**
 * Génère le PNG du QR code pointant vers l'URL de vérification.
 * @returns {Promise<Buffer|null>} null si la génération échoue (le PDF reste valide).
 */
export async function verifyQrPng(number) {
  try {
    return await QRCode.toBuffer(verifyUrlFor(number), {
      type: 'png',
      errorCorrectionLevel: 'M',
      margin: 1,
      scale: 6,
      color: { dark: '#0A2132ff', light: '#ffffffff' },
    });
  } catch (e) {
    console.error('[DOC] verifyQrPng:', e.message);
    return null;
  }
}
