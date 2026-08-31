import prisma from '../config/prisma.js';
import { sendMail } from '../services/mail.service.js';
import { quoteReceivedEmail } from '../services/mail.templates.js';

// Public: Demander un devis
export const createQuote = async (req, res) => {
  const { clientName, email, serviceType, description } = req.body;
  try {
    const quote = await prisma.quote.create({
      data: { clientName, email, serviceType, description }
    });

    // Email de confirmation au client
    await sendMail({
      to: email,
      subject: 'Votre demande de devis — TowerStructure',
      html: quoteReceivedEmail({ clientName, serviceType })
    });

    return res.status(201).json({ message: "Devis envoyé avec succès", quote });
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de l'envoi du devis." });
  }
};

// Admin: Voir tous les devis avec pagination
export const getQuotes = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [total, quotes] = await Promise.all([
      prisma.quote.count(),
      prisma.quote.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit })
    ]);

    return res.status(200).json({ data: quotes, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return res.status(500).json({ message: "Erreur récupération des devis." });
  }
};

// Admin: Changer le statut du devis
export const updateQuoteStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const quote = await prisma.quote.update({ where: { id }, data: { status } });
    return res.status(200).json(quote);
  } catch (error) {
    return res.status(500).json({ message: "Erreur mise à jour devis." });
  }
};
