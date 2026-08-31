import prisma from '../config/prisma.js';
import { decorateLessonsWithLockState } from '../services/lesson.service.js';

/**
 * Récupérer une seule formation par son ID (Public)
 */
export const getCourseById = async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id }
    });
    if (!course) return res.status(404).json({ message: "Formation introuvable" });
    return res.status(200).json(course);
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

/**
 * Récupérer les formations auxquelles l'étudiant est inscrit (Protégé)
 */
export const getMyCourses = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId, accessStatus: 'ACTIVE' },
      include: {
        course: true,
        classroom: true
      }
    });

    // Pour chaque cours, calculer la progression
    const myCourses = await Promise.all(enrollments.map(async (enrollment) => {
      const lessons = await prisma.moduleLesson.findMany({ where: { courseId: enrollment.courseId } });
      const totalLessons = lessons.length;
      
      const completedLines = await prisma.progress.count({
        where: {
          studentId,
          lessonId: { in: lessons.map(l => l.id) },
          isCompleted: true
        }
      });

      const progressRate = totalLessons > 0 ? Math.round((completedLines / totalLessons) * 100) : 0;

      return {
        ...enrollment.course,
        enrollmentId: enrollment.id,
        progressRate,
        classroomId: enrollment.classroomId,
        classroomName: enrollment.classroom?.name
      };
    }));

    return res.status(200).json(myCourses);
  } catch (error) {
    console.error("[COURSE] Erreur récupération mes cours :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

/**
 * Récupérer les chapitres et médias d'une formation (Protégé)
 * Vérifie de manière stricte que l'utilisateur a un accès ACTIVE
 */
export const getCourseLessons = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const userId = req.user.id;

    // 1. Vérification stricte des droits d'accès
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: userId,
          courseId: courseId
        }
      }
    });

    if (!enrollment || enrollment.accessStatus !== 'ACTIVE') {
      return res.status(403).json({ 
        message: "Accès refusé. Vous devez être inscrit et avoir un statut actif pour visionner ce contenu." 
      });
    }

    // 2. Récupération des leçons + état de verrouillage séquentiel
    const lessons = await prisma.moduleLesson.findMany({
      where: { courseId },
      orderBy: { sequenceOrder: 'asc' },
      include: {
        progressions: {
          where: { studentId: userId },
          select: { isCompleted: true, videoProgress: true, timeSpentSeconds: true }
        },
        quizzes: { select: { id: true }, take: 1 }
      }
    });

    return res.status(200).json(decorateLessonsWithLockState(lessons));
  } catch (error) {
    console.error("[COURSE] Erreur récupération leçons :", error);
    return res.status(500).json({ message: "Erreur serveur lors de la récupération des leçons." });
  }
};

/**
 * Permet à l'étudiant de cocher une leçon comme terminée
 */
export const markLessonComplete = async (req, res) => {
  try {
    const { id: lessonId } = req.params;
    const userId = req.user.id;
    const { isCompleted } = req.body;

    // Mise à jour ou création de l'enregistrement de progression (Upsert)
    const progress = await prisma.progress.upsert({
      where: {
        studentId_lessonId: {
          studentId: userId,
          lessonId: lessonId
        }
      },
      update: {
        isCompleted: isCompleted !== undefined ? isCompleted : true
      },
      create: {
        studentId: userId,
        lessonId: lessonId,
        isCompleted: isCompleted !== undefined ? isCompleted : true
      }
    });

    return res.status(200).json({
      message: "Progression mise à jour avec succès.",
      progress
    });
  } catch (error) {
    console.error("[COURSE] Erreur mise à jour progression :", error);
    return res.status(500).json({ message: "Erreur serveur lors de la mise à jour de la progression." });
  }
};
