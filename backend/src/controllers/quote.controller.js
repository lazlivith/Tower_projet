import prisma from '../config/prisma.js';
import { sendMail } from '../services/mail.service.js';
import { quoteReceivedEmail, quoteForAdminEmail } from '../services/mail.templates.js';
import { generateDocument } from '../services/documents/index.js';
import { nextNumber } from '../services/documents/numbering.js';

// Public: Demander un devis — génère aussitôt le PDF pour l'admin.
export const createQuote = async (req, res) => {
  const { clientName, email, serviceType, description } = req.body;
  try {
    const reference = await nextNumber('QUOTE');
    const quote = await prisma.quote.create({
      data: { clientName, email, serviceType, description, reference },
    });

    // 1) PDF du devis (montant "sur étude" à ce stade)
    let documentUrl = null;
    try {
      const doc = await generateDocument(
        'QUOTE',
        { number: reference, clientName, clientEmail: email, serviceType, description, amount: null, currency: 'MAD' },
        { quoteId: quote.id, title: `Devis — ${clientName}` }
      );
      documentUrl = doc.url;
    } catch (e) {
      console.error('[QUOTE] génération PDF:', e.message);
    }

    // 2) Notification interne aux managers
    const managers = await prisma.user.findMany({ where: { role: 'MANAGER' }, select: { id: true } });
    if (managers.length) {
      await prisma.notification.createMany({
        data: managers.map((m) => ({
          userId: m.id,
          type: 'SYSTEM',
          message: `Nouvelle demande de devis ${reference} — ${clientName} (${serviceType})`,
        })),
      });
    }

    // 3) Emails : accusé client + notification admin (avec le PDF)
    await sendMail({
      to: email,
      subject: 'Votre demande de devis — Tower Structure',
      html: quoteReceivedEmail({ clientName, serviceType }),
    });
    const adminTo = process.env.ADMIN_NOTIFY_EMAIL;
    if (adminTo) {
      await sendMail({
        to: adminTo,
        subject: `Nouveau devis ${reference} — ${clientName}`,
        html: quoteForAdminEmail({ clientName, email, serviceType, description, reference, documentUrl }),
      });
    }

    return res.status(201).json({ message: 'Devis envoyé avec succès', quote, reference, documentUrl });
  } catch (error) {
    console.error('[QUOTE] createQuote:', error);
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
