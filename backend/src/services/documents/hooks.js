import prisma from '../../config/prisma.js';
import { generateDocument } from './index.js';

/**
 * Génère (une seule fois) l'attestation d'inscription d'un élève à une formation.
 * À appeler dès que l'accès devient ACTIVE. Non bloquant : les erreurs sont loguées.
 */
export async function ensureEnrollmentAttestation(studentId, courseId) {
  try {
    const existing = await prisma.generatedDocument.findFirst({
      where: { type: 'ENROLLMENT_ATTESTATION', userId: studentId, courseId },
      select: { id: true },
    });
    if (existing) return { created: false };

    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
      include: {
        student: { select: { id: true, nom: true } },
        course: { select: { id: true, title: true, level: true, durationHours: true } },
        classroom: { select: { name: true } },
      },
    });
    if (!enrollment) return { created: false };

    await generateDocument(
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
      { userId: enrollment.student.id, courseId: enrollment.course.id, title: `Attestation d'inscription — ${enrollment.student.nom}` }
    );
    return { created: true };
  } catch (e) {
    console.error('[DOC] ensureEnrollmentAttestation:', e.message);
    return { created: false, error: e.message };
  }
}
