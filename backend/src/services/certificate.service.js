import prisma from '../config/prisma.js';
import { generateCertificatePDF } from './pdf.service.js';

/** Heures de présence minimales requises pour l'obtention du certificat. */
export const CERT_MIN_HOURS = 85;

/**
 * Score de la formation pour un étudiant : moyenne du meilleur score par quiz.
 * 100 par défaut si la formation ne comporte aucun quiz.
 */
async function computeCourseScore(studentId, classroomId) {
  const quizzes = await prisma.quiz.findMany({ where: { classroomId }, select: { id: true } });
  if (quizzes.length === 0) return 100;

  const attempts = await prisma.quizAttempt.findMany({
    where: { studentId, quizId: { in: quizzes.map((q) => q.id) } },
    select: { quizId: true, score: true },
  });

  const best = {};
  for (const a of attempts) best[a.quizId] = Math.max(best[a.quizId] ?? 0, a.score);
  const scores = quizzes.map((q) => best[q.id] ?? 0);
  return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
}

/**
 * Évalue l'éligibilité au certificat : heures de présence >= seuil ET tous les quiz validés.
 */
export async function evaluateCertificateEligibility(studentId, courseId) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
    include: { course: { select: { title: true } } },
  });
  if (!enrollment) return { eligible: false, reason: 'Inscription introuvable.' };

  const hoursSpent = enrollment.hoursSpent || 0;
  const hoursOk = hoursSpent >= CERT_MIN_HOURS;

  const quizzes = await prisma.quiz.findMany({
    where: { classroomId: enrollment.classroomId },
    select: { id: true },
  });

  let quizzesOk = true;
  let passedCount = 0;
  if (quizzes.length > 0) {
    const passed = await prisma.quizAttempt.findMany({
      where: { studentId, passed: true, quizId: { in: quizzes.map((q) => q.id) } },
      distinct: ['quizId'],
      select: { quizId: true },
    });
    passedCount = passed.length;
    quizzesOk = passedCount === quizzes.length;
  }

  return {
    eligible: hoursOk && quizzesOk,
    courseId,
    courseTitle: enrollment.course.title,
    hoursSpent: Math.round(hoursSpent * 10) / 10,
    hoursRequired: CERT_MIN_HOURS,
    hoursOk,
    quizzesOk,
    quizzesPassed: passedCount,
    quizzesTotal: quizzes.length,
  };
}

/**
 * Délivre le certificat si l'étudiant est éligible et qu'il n'en a pas déjà un.
 * Génère le PDF (avec heures effectuées), crée la ligne Certificate et notifie l'étudiant.
 * Idempotent — sûr à appeler après chaque quiz validé ou ping de temps.
 */
export async function issueCertificateIfEligible(studentId, courseId) {
  const existing = await prisma.certificate.findFirst({ where: { studentId, courseId } });
  if (existing) return { issued: false, alreadyIssued: true, certificate: existing };

  const eligibility = await evaluateCertificateEligibility(studentId, courseId);
  if (!eligibility.eligible) return { issued: false, eligibility };

  const [student, course, enrollment] = await Promise.all([
    prisma.user.findUnique({ where: { id: studentId } }),
    prisma.course.findUnique({ where: { id: courseId } }),
    prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId, courseId } } }),
  ]);

  const score = await computeCourseScore(studentId, enrollment.classroomId);
  const pdfUrl = await generateCertificatePDF(student, course, score, eligibility.hoursSpent);

  const certificate = await prisma.certificate.create({
    data: { studentId, courseId, pdfUrl, score },
  });

  await prisma.notification.create({
    data: {
      userId: studentId,
      type: 'SYSTEM',
      message: `Félicitations ! Votre certificat pour « ${course.title} » est disponible au téléchargement.`,
    },
  });

  return { issued: true, certificate, eligibility };
}
