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
 * Sert les octets d'un document généré (PDF), stockés en base.
 * Indépendant de tout CDN — Cloudinary bloque la livraison des PDF par défaut.
 */
router.get('/file/:number', async (req, res) => {
  try {
    const number = String(req.params.number || '').trim().toUpperCase();
    const doc = await prisma.generatedDocument.findUnique({
      where: { number },
      select: { number: true, content: true },
    });
    if (!doc?.content) return res.status(404).json({ message: 'Document introuvable.' });

    const buf = Buffer.from(doc.content);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${doc.number}.pdf"`);
    res.setHeader('Content-Length', buf.length);
    res.setHeader('Cache-Control', 'private, max-age=300');
    return res.send(buf);
  } catch (error) {
    console.error('[DOC] file:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération du document.' });
  }
});

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
