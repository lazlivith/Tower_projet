import prisma from '../config/prisma.js';
import { issueCertificateIfEligible, evaluateCertificateEligibility } from '../services/certificate.service.js';

const absolute = (req, relative) =>
  relative?.startsWith('http') ? relative : `${req.protocol}://${req.get('host')}${relative}`;

/**
 * ÉTUDIANT — Liste des certificats + état d'avancement pour les formations non encore certifiées.
 * Tente une délivrance paresseuse (lazy) pour chaque inscription active avant de répondre.
 */
export const getMyCertificates = async (req, res) => {
  const studentId = req.user.id;
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      select: { courseId: true, accessStatus: true },
    });

    // Délivrance paresseuse
    await Promise.all(
      enrollments.map((e) => issueCertificateIfEligible(studentId, e.courseId).catch(() => null))
    );

    const certificates = await prisma.certificate.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: { course: { select: { id: true, title: true } } },
    });

    const certifiedCourseIds = new Set(certificates.map((c) => c.courseId));
    const pending = (
      await Promise.all(
        enrollments
          .filter((e) => !certifiedCourseIds.has(e.courseId))
          .map((e) => evaluateCertificateEligibility(studentId, e.courseId).catch(() => null))
      )
    ).filter(Boolean);

    return res.status(200).json({
      certificates: certificates.map((c) => ({
        id: c.id,
        courseId: c.courseId,
        courseTitle: c.course.title,
        score: Number(c.score),
        issuedAt: c.createdAt,
        downloadUrl: absolute(req, c.pdfUrl),
      })),
      pending,
    });
  } catch (error) {
    console.error('[CERT] getMyCertificates:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des certificats.' });
  }
};
