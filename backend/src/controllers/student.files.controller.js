import prisma from '../config/prisma.js';

/**
 * GET /api/student/documents
 * Documents personnels générés automatiquement : attestation d'inscription,
 * factures de paiement, certificat(s) de réussite.
 */
export const getMyDocuments = async (req, res) => {
  try {
    const docs = await prisma.generatedDocument.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, type: true, number: true, title: true, url: true, courseId: true, createdAt: true },
    });

    // Certificats hérités (table Certificate) non encore dans le registre
    const certs = await prisma.certificate.findMany({
      where: { studentId: req.user.id },
      include: { course: { select: { title: true } } },
    });
    const known = new Set(docs.filter((d) => d.type === 'CERTIFICATE').map((d) => d.courseId));
    const extraCerts = certs
      .filter((c) => !known.has(c.courseId))
      .map((c) => ({
        id: `cert-${c.id}`,
        type: 'CERTIFICATE',
        number: null,
        title: `Certificat — ${c.course.title}`,
        url: c.pdfUrl,
        courseId: c.courseId,
        createdAt: c.createdAt,
      }));

    return res.status(200).json([...docs, ...extraCerts].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));
  } catch (error) {
    console.error('[STUDENT] getMyDocuments:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération de vos documents.' });
  }
};

/**
 * GET /api/student/reports
 * Rapports de l'élève : travaux/projets rendus + note et statut de correction.
 */
export const getMyReports = async (req, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      where: { studentId: req.user.id },
      orderBy: { submittedAt: 'desc' },
      include: { assignment: { select: { title: true, dueDate: true, course: { select: { title: true } } } } },
    });

    return res.status(200).json(
      submissions.map((s) => ({
        id: s.id,
        assignment: s.assignment.title,
        course: s.assignment.course.title,
        fileUrl: s.fileUrl,
        grade: s.grade != null ? Number(s.grade) : null,
        status: s.status, // PENDING | GRADED | ...
        submittedAt: s.submittedAt,
        dueDate: s.assignment.dueDate,
      }))
    );
  } catch (error) {
    console.error('[STUDENT] getMyReports:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération de vos rapports.' });
  }
};
