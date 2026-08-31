import prisma from '../config/prisma.js';
import { resolveVideoEmbed, isLessonUnlocked, VIDEO_COMPLETION_THRESHOLD } from '../services/lesson.service.js';
import { issueCertificateIfEligible } from '../services/certificate.service.js';

/** Charge la leçon + vérifie que l'étudiant a un accès ACTIVE au cours. */
const loadLessonForStudent = async (studentId, lessonId) => {
  const lesson = await prisma.moduleLesson.findUnique({ where: { id: lessonId } });
  if (!lesson) { const e = new Error('Leçon introuvable.'); e.status = 404; throw e; }

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId: lesson.courseId } },
    select: { id: true, accessStatus: true },
  });
  if (!enrollment || enrollment.accessStatus !== 'ACTIVE') {
    const e = new Error('Accès refusé. Inscription active requise.'); e.status = 403; throw e;
  }
  return { lesson, enrollment };
};

/**
 * GET /api/lessons/:id/video
 * Retourne l'URL d'embed de la vidéo. 403 si le chapitre précédent n'est pas achevé.
 */
export const getLessonVideo = async (req, res) => {
  try {
    const { lesson } = await loadLessonForStudent(req.user.id, req.params.id);

    const lock = await isLessonUnlocked(req.user.id, lesson.id);
    if (!lock.unlocked) {
      return res.status(403).json({ message: lock.reason, locked: true, blockingLessonTitle: lock.blockingLessonTitle });
    }

    const video = resolveVideoEmbed(lesson.videoUrl);
    if (video.provider === 'none') {
      return res.status(404).json({ message: "Cette leçon n'a pas de vidéo." });
    }

    return res.status(200).json({
      lessonId: lesson.id,
      title: lesson.title,
      ...video,
      completionThreshold: VIDEO_COMPLETION_THRESHOLD,
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('[LESSON] getLessonVideo:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

/**
 * POST /api/lessons/:id/track   body: { seconds?: number, videoPercent?: number }
 * Pinger de temps de présence : cumule le temps, mémorise le % de visionnage max,
 * marque la leçon achevée au-delà du seuil, et cumule les heures sur l'inscription.
 */
export const trackTimeSpent = async (req, res) => {
  try {
    const { lesson, enrollment } = await loadLessonForStudent(req.user.id, req.params.id);

    const seconds = Math.max(0, Math.min(3600, Number(req.body.seconds) || 0));
    const videoPercent = Math.max(0, Math.min(100, Number(req.body.videoPercent) || 0));

    const current = await prisma.progress.findUnique({
      where: { studentId_lessonId: { studentId: req.user.id, lessonId: lesson.id } },
    });

    const newVideoProgress = Math.max(current?.videoProgress || 0, videoPercent);
    const newTimeSpent = (current?.timeSpentSeconds || 0) + seconds;
    const autoComplete = newVideoProgress >= VIDEO_COMPLETION_THRESHOLD;

    const [progress] = await prisma.$transaction([
      prisma.progress.upsert({
        where: { studentId_lessonId: { studentId: req.user.id, lessonId: lesson.id } },
        update: {
          videoProgress: newVideoProgress,
          timeSpentSeconds: newTimeSpent,
          ...(autoComplete ? { isCompleted: true } : {}),
        },
        create: {
          studentId: req.user.id,
          lessonId: lesson.id,
          videoProgress: newVideoProgress,
          timeSpentSeconds: newTimeSpent,
          isCompleted: autoComplete,
        },
      }),
      prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { hoursSpent: { increment: seconds / 3600 } },
      }),
    ]);

    // Les heures viennent d'augmenter → tenter une délivrance de certificat (non bloquant)
    issueCertificateIfEligible(req.user.id, lesson.courseId).catch(() => {});

    return res.status(200).json({
      videoProgress: progress.videoProgress,
      timeSpentSeconds: progress.timeSpentSeconds,
      isCompleted: progress.isCompleted,
      completionThreshold: VIDEO_COMPLETION_THRESHOLD,
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('[LESSON] trackTimeSpent:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};
