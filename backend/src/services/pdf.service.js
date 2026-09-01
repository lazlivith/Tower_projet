import { generateDocument } from './documents/index.js';

/**
 * Compat historique — délègue au générateur de documents unifié
 * (`src/services/documents/`). Renvoie l'URL publique du PDF.
 */

/** Reçu / facture de paiement. */
export const generateInvoicePDF = async (paymentData, studentInfo, courseInfo) => {
  const { url } = await generateDocument(
    'INVOICE',
    {
      clientName: studentInfo?.nom,
      clientEmail: studentInfo?.email,
      courseTitle: courseInfo?.title,
      amount: Number(paymentData?.amount || 0),
      currency: 'MAD',
      paymentMethod: paymentData?.paymentMethod,
      paidAt: paymentData?.createdAt,
    },
    {
      userId: studentInfo?.id || null,
      courseId: courseInfo?.id || null,
      paymentId: paymentData?.id || null,
      title: `Facture — ${studentInfo?.nom ?? ''}`.trim(),
    }
  );
  return url;
};

/** Certificat de réussite (score en %, heures effectuées optionnelles). */
export const generateCertificatePDF = async (studentInfo, courseInfo, score, hoursSpent = null) => {
  const { url } = await generateDocument(
    'CERTIFICATE',
    {
      studentName: studentInfo?.nom,
      courseTitle: courseInfo?.title,
      score: Number(score),
      hours: hoursSpent,
    },
    {
      userId: studentInfo?.id || null,
      courseId: courseInfo?.id || null,
      title: `Certificat — ${studentInfo?.nom ?? ''}`.trim(),
    }
  );
  return url;
};
