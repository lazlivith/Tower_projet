import prisma from '../config/prisma.js';
import { resolveVideoEmbed, isLessonUnlocked } from '../services/lesson.service.js';

export const getMyDashboard = async (req, res) => {
  try {
    const studentId = req.user.id;

    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: studentId,
        accessStatus: 'ACTIVE'
      },
      include: {
        course: {
          include: {
            lessons: {
              include: {
                progressions: {
                  where: { studentId: studentId }
                },
                quizzes: { select: { id: true }, take: 1 }
              },
              orderBy: { sequenceOrder: 'asc' }
            },
            liveSessions: {
              where: {
                scheduledAt: { gte: new Date() }
              },
              orderBy: { scheduledAt: 'asc' }
            }
          }
        },
        classroom: {
          include: {
            instructor: {
              select: { id: true, nom: true, email: true }
            }
          }
        }
      }
    });

    // Formatting response to compute progress Rate
    const dashboardData = enrollments.map(enrollment => {
      const lessons = enrollment.course.lessons;
      const totalLessons = lessons.length;
      let completedLessonsCount = 0;

      let previousCompleted = true; // la 1re leçon est toujours ouverte
      const formattedLessons = lessons.map(lesson => {
        const progress = lesson.progressions[0];
        const isCompleted = progress?.isCompleted ?? false;
        if (isCompleted) completedLessonsCount++;
        const locked = !previousCompleted;
        const video = resolveVideoEmbed(lesson.videoUrl);
        const row = {
          id: lesson.id,
          title: lesson.title,
          videoUrl: lesson.videoUrl,
          videoProvider: video.provider,
          videoEmbedUrl: video.embedUrl,
          documentUrl: lesson.documentUrl,
          sequenceOrder: lesson.sequenceOrder,
          isCompleted,
          videoProgress: progress?.videoProgress ?? 0,
          hasQuiz: (lesson.quizzes?.length ?? 0) > 0,
          locked,
          lockReason: locked ? "Non disponible à moins que l'activité précédente soit marquée comme achevée" : null
        };
        previousCompleted = isCompleted;
        return row;
      });

      const progressRate = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;

      return {
        enrollmentId: enrollment.id,
        paymentPlan: enrollment.paymentPlan,
        nextPaymentDue: enrollment.nextPaymentDue,
        progressRate,
        course: {
          id: enrollment.course.id,
          title: enrollment.course.title,
          description: enrollment.course.description,
          imageUrl: enrollment.course.imageUrl,
          lessons: formattedLessons,
          upcomingLiveSessions: enrollment.course.liveSessions.map(ls => ({
            id: ls.id,
            title: ls.title,
            jitsiUrl: ls.jitsiUrl,
            scheduledAt: ls.scheduledAt,
            duration: ls.duration
          }))
        },
        classroom: enrollment.classroom ? {
          id: enrollment.classroom.id,
          name: enrollment.classroom.name,
          instructor: enrollment.classroom.instructor || null
        } : null
      };
    });

    return res.status(200).json(dashboardData);
  } catch (error) {
    console.error("[STUDENT] Erreur getMyDashboard:", error);
    return res.status(500).json({ message: "Erreur serveur lors de la récupération du tableau de bord étudiant." });
  }
};

export const toggleLessonComplete = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const studentId = req.user.id;
    const { isCompleted } = req.body;
    const targetValue = isCompleted !== undefined ? isCompleted : true;

    // On ne peut pas marquer « terminé » un chapitre encore verrouillé (déblocage séquentiel)
    if (targetValue === true) {
      const lock = await isLessonUnlocked(studentId, lessonId);
      if (!lock.unlocked) {
        return res.status(403).json({ message: lock.reason, locked: true, blockingLessonTitle: lock.blockingLessonTitle });
      }
    }

    const progress = await prisma.progress.upsert({
      where: {
        studentId_lessonId: {
          studentId: studentId,
          lessonId: lessonId
        }
      },
      update: {
        isCompleted: isCompleted !== undefined ? isCompleted : true
      },
      create: {
        studentId: studentId,
        lessonId: lessonId,
        isCompleted: isCompleted !== undefined ? isCompleted : true
      }
    });

    return res.status(200).json({
      message: "Progression mise à jour avec succès.",
      progress
    });
  } catch (error) {
    console.error("[STUDENT] Erreur toggleLessonComplete:", error);
    return res.status(500).json({ message: "Erreur serveur lors de la mise à jour de la leçon." });
  }
};
