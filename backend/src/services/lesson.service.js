import prisma from '../config/prisma.js';

/** Seuil de visionnage (%) au-delà duquel un chapitre vidéo est marqué achevé automatiquement. */
export const VIDEO_COMPLETION_THRESHOLD = 90;

/**
 * Extrait l'identifiant d'une vidéo YouTube depuis une URL (watch?v=, youtu.be/, /embed/, /shorts/).
 * @returns {string|null}
 */
export const extractYouTubeId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
};

/**
 * Construit l'URL d'embed iFrame pour une leçon selon sa source vidéo.
 * @returns {{ provider: 'youtube'|'vimeo'|'file'|'none', embedUrl: string|null, originalUrl: string|null }}
 */
export const resolveVideoEmbed = (videoUrl) => {
  if (!videoUrl) return { provider: 'none', embedUrl: null, originalUrl: null };

  const ytId = extractYouTubeId(videoUrl);
  if (ytId) {
    return { provider: 'youtube', embedUrl: `https://www.youtube.com/embed/${ytId}`, originalUrl: videoUrl };
  }

  const vimeo = videoUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) {
    return { provider: 'vimeo', embedUrl: `https://player.vimeo.com/video/${vimeo[1]}`, originalUrl: videoUrl };
  }

  // Upload direct / autre URL lisible telle quelle dans un <video> ou <iframe>
  return { provider: 'file', embedUrl: videoUrl, originalUrl: videoUrl };
};

/**
 * Déblocage séquentiel : une leçon est déverrouillée si c'est la première du cours,
 * ou si la leçon précédente (sequenceOrder - 1) a `isCompleted: true` pour cet étudiant.
 *
 * @returns {Promise<{ unlocked: boolean, reason: string|null, blockingLessonTitle: string|null }>}
 */
export const isLessonUnlocked = async (studentId, lessonId) => {
  const lesson = await prisma.moduleLesson.findUnique({
    where: { id: lessonId },
    select: { id: true, courseId: true, sequenceOrder: true },
  });
  if (!lesson) return { unlocked: false, reason: 'Leçon introuvable.', blockingLessonTitle: null };

  if (lesson.sequenceOrder <= 1) return { unlocked: true, reason: null, blockingLessonTitle: null };

  const previous = await prisma.moduleLesson.findFirst({
    where: { courseId: lesson.courseId, sequenceOrder: lesson.sequenceOrder - 1 },
    select: { id: true, title: true },
  });
  if (!previous) return { unlocked: true, reason: null, blockingLessonTitle: null };

  const prevProgress = await prisma.progress.findUnique({
    where: { studentId_lessonId: { studentId, lessonId: previous.id } },
    select: { isCompleted: true },
  });

  if (prevProgress?.isCompleted) return { unlocked: true, reason: null, blockingLessonTitle: null };

  return {
    unlocked: false,
    reason: `Non disponible à moins que l'activité « ${previous.title} » soit marquée comme achevée`,
    blockingLessonTitle: previous.title,
  };
};

/**
 * Décore une liste de leçons ordonnées avec l'état de verrouillage pour un étudiant.
 * `lessons` doit contenir `{ id, sequenceOrder, title, progressions: [{ isCompleted }] }`, trié par sequenceOrder.
 */
export const decorateLessonsWithLockState = (lessons) => {
  let previousCompleted = true; // la 1re est toujours ouverte
  return lessons.map((lesson) => {
    const isCompleted = lesson.progressions?.[0]?.isCompleted ?? false;
    const unlocked = previousCompleted;
    const decorated = {
      ...lesson,
      isCompleted,
      locked: !unlocked,
      lockReason: unlocked ? null : `Non disponible à moins que l'activité précédente soit marquée comme achevée`,
    };
    previousCompleted = isCompleted;
    return decorated;
  });
};
