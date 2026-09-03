import prisma from '../config/prisma.js';
import { generateDocument, DOCUMENT_TYPES, fileUrlAbsolute } from '../services/documents/index.js';
import { nextNumber } from '../services/documents/numbering.js';

/** Réponse API : URL de téléchargement absolue (le stockage garde l'URL relative). */
const withAbsoluteUrl = (doc) => ({ ...doc, url: fileUrlAbsolute(doc.number) });

/** GET /api/admin/documents?type=&q= — registre des documents générés. */
export const listDocuments = async (req, res) => {
  try {
    const type = DOCUMENT_TYPES.includes(req.query.type) ? req.query.type : undefined;
    const q = (req.query.q || '').toString().trim();
    const docs = await prisma.generatedDocument.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(q ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { number: { contains: q, mode: 'insensitive' } }] } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      omit: { content: true }, // ne jamais renvoyer les octets du PDF dans la liste
      include: { user: { select: { id: true, nom: true, email: true } } },
    });
    return res.status(200).json(docs.map((d) => ({ ...d, url: fileUrlAbsolute(d.number) })));
  } catch (error) {
    console.error('[DOC] listDocuments:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des documents.' });
  }
};

/** POST /api/admin/documents/attestation  { studentId, courseId } */
export const createAttestation = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;
    if (!studentId || !courseId) return res.status(400).json({ message: 'studentId et courseId requis.' });

    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
      include: {
        student: { select: { id: true, nom: true } },
        course: { select: { id: true, title: true, level: true, durationHours: true } },
        classroom: { select: { name: true } },
      },
    });
    if (!enrollment) return res.status(404).json({ message: "Aucune inscription trouvée pour cet élève et cette formation." });

    const doc = await generateDocument(
      'ENROLLMENT_ATTESTATION',
      {
        studentName: enrollment.student.nom,
        courseTitle: enrollment.course.title,
        level: enrollment.course.level,
        durationHours: enrollment.course.durationHours,
        classroom: enrollment.classroom?.name,
        startedAt: enrollment.createdAt,
        status: enrollment.accessStatus,
      },
      {
        userId: enrollment.student.id,
        courseId: enrollment.course.id,
        title: `Attestation d'inscription — ${enrollment.student.nom}`,
      }
    );
    return res.status(201).json({ message: 'Attestation générée.', document: withAbsoluteUrl(doc) });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('[DOC] createAttestation:', error);
    return res.status(500).json({ message: "Erreur lors de la génération de l'attestation." });
  }
};

/** POST /api/admin/documents/quote/:quoteId  { amount?, validUntil? } */
export const createQuoteDocument = async (req, res) => {
  try {
    const quote = await prisma.quote.findUnique({ where: { id: req.params.quoteId } });
    if (!quote) return res.status(404).json({ message: 'Devis introuvable.' });

    const amount = req.body.amount != null && req.body.amount !== '' ? Number(req.body.amount) : quote.amount;
    const validUntil = req.body.validUntil ? new Date(req.body.validUntil) : quote.validUntil;
    const reference = quote.reference || (await nextNumber('QUOTE'));

    await prisma.quote.update({
      where: { id: quote.id },
      data: {
        reference,
        ...(amount != null ? { amount } : {}),
        ...(validUntil ? { validUntil } : {}),
      },
    });

    const doc = await generateDocument(
      'QUOTE',
      {
        number: reference,
        clientName: quote.clientName,
        clientEmail: quote.email,
        serviceType: quote.serviceType,
        description: quote.description,
        amount: amount != null ? Number(amount) : null,
        currency: 'MAD',
        validUntil,
      },
      { quoteId: quote.id, title: `Devis — ${quote.clientName}` }
    );
    return res.status(201).json({ message: 'Devis PDF généré.', document: withAbsoluteUrl(doc), reference });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('[DOC] createQuoteDocument:', error);
    return res.status(500).json({ message: 'Erreur lors de la génération du devis.' });
  }
};

/** POST /api/admin/documents/invoice/:paymentId — (re)génère la facture d'un paiement. */
export const createInvoiceDocument = async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.paymentId },
      include: {
        enrollment: {
          include: {
            student: { select: { id: true, nom: true, email: true } },
            course: { select: { id: true, title: true } },
          },
        },
      },
    });
    if (!payment) return res.status(404).json({ message: 'Paiement introuvable.' });

    const doc = await generateDocument(
      'INVOICE',
      {
        clientName: payment.enrollment.student.nom,
        clientEmail: payment.enrollment.student.email,
        courseTitle: payment.enrollment.course.title,
        amount: Number(payment.amount),
        currency: 'MAD',
        paymentMethod: payment.paymentMethod,
        paidAt: payment.createdAt,
      },
      {
        userId: payment.enrollment.student.id,
        courseId: payment.enrollment.course.id,
        paymentId: payment.id,
        title: `Facture — ${payment.enrollment.student.nom}`,
      }
    );
    return res.status(201).json({ message: 'Facture générée.', document: withAbsoluteUrl(doc) });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('[DOC] createInvoiceDocument:', error);
    return res.status(500).json({ message: 'Erreur lors de la génération de la facture.' });
  }
};

/** POST /api/admin/documents/certificate  { studentId, courseId } — délivrance manuelle. */
export const createCertificateDocument = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;
    if (!studentId || !courseId) return res.status(400).json({ message: 'studentId et courseId requis.' });

    const [student, course, enrollment] = await Promise.all([
      prisma.user.findUnique({ where: { id: studentId }, select: { id: true, nom: true } }),
      prisma.course.findUnique({ where: { id: courseId }, select: { id: true, title: true } }),
      prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId, courseId } }, select: { hoursSpent: true } }),
    ]);
    if (!student || !course) return res.status(404).json({ message: 'Élève ou formation introuvable.' });

    const score = req.body.score != null ? Number(req.body.score) : 100;
    const doc = await generateDocument(
      'CERTIFICATE',
      { studentName: student.nom, courseTitle: course.title, score, hours: enrollment?.hoursSpent ?? null },
      { userId: student.id, courseId: course.id, title: `Certificat — ${student.nom}` }
    );

    // enregistre aussi dans la table Certificate si absente (pour l'espace élève)
    const exists = await prisma.certificate.findFirst({ where: { studentId, courseId } });
    if (!exists) {
      await prisma.certificate.create({ data: { studentId, courseId, pdfUrl: doc.url, score } });
    }
    return res.status(201).json({ message: 'Certificat généré.', document: withAbsoluteUrl(doc) });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('[DOC] createCertificateDocument:', error);
    return res.status(500).json({ message: 'Erreur lors de la génération du certificat.' });
  }
};
