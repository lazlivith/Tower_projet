import { Router } from 'express';
import prisma from '../config/prisma.js';

const router = Router();

const TYPE_LABEL = {
  CERTIFICATE: 'Certificat de réussite',
  INVOICE: 'Facture',
  QUOTE: 'Devis',
  ENROLLMENT_ATTESTATION: "Attestation d'inscription",
};

/**
 * PUBLIC — Vérifie l'authenticité d'un document par sa référence.
 * Ne renvoie aucune donnée personnelle : uniquement le type, la date et la validité.
 */
router.get('/verify/:number', async (req, res) => {
  try {
    const number = String(req.params.number || '').trim().toUpperCase();
    const doc = await prisma.generatedDocument.findUnique({
      where: { number },
      select: { number: true, type: true, createdAt: true },
    });
    if (!doc) return res.status(200).json({ valid: false, number });
    return res.status(200).json({
      valid: true,
      number: doc.number,
      type: doc.type,
      typeLabel: TYPE_LABEL[doc.type] || doc.type,
      issuedAt: doc.createdAt,
    });
  } catch (error) {
    console.error('[DOC] verify:', error);
    return res.status(500).json({ message: 'Erreur lors de la vérification.' });
  }
});

export default router;
