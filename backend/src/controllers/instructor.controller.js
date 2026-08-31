import prisma from '../config/prisma.js';
import { generateRoomName, buildRoomUrl } from '../services/jitsi.service.js';

/**
 * INSTRUCTEUR : Obtenir la liste de ses cours avec statistiques
 * Version optimisée — élimine le problème N+1 avec Promise.all et requêtes groupées
 */
export const getMyInstructorCourses = async (req, res) => {
  const instructorId = req.user.id;
  try {
    const classrooms = await prisma.classroom.findMany({
      where: { instructorId },
      include: {
        course: true,
        enrollments: {
          where: { accessStatus: 'ACTIVE' },
          select: { studentId: true }
        }
      }
    });

    if (classrooms.length === 0) return res.status(200).json([]);

    // Regrouper les cours uniques
    const courseMap = {};
    for (const classroom of classrooms) {
      const courseId = classroom.course.id;
      if (!courseMap[courseId]) {
        courseMap[courseId] = {
          ...classroom.course,
          studentIds: []
        };
      }
      for (const e of classroom.enrollments) {
        if (!courseMap[courseId].studentIds.includes(e.studentId)) {
          courseMap[courseId].studentIds.push(e.studentId);
        }
      }
    }

    const courseIds = Object.keys(courseMap);
    const allStudentIds = [...new Set(Object.values(courseMap).flatMap(c => c.studentIds))];

    // Une seule requête pour toutes les leçons de tous les cours
    const [allLessons, allProgresses, allSubmissions] = await Promise.all([
      prisma.moduleLesson.findMany({
        where: { courseId: { in: courseIds } },
        select: { id: true, courseId: true }
      }),
      allStudentIds.length > 0 ? prisma.progress.findMany({
        where: { studentId: { in: allStudentIds }, isCompleted: true },
        select: { studentId: true, lessonId: true }
      }) : Promise.resolve([]),
      allStudentIds.length > 0 ? prisma.submission.findMany({
        where: {
          studentId: { in: allStudentIds },
          status: 'GRADED',
          assignment: { courseId: { in: courseIds } }
        },
        select: { grade: true, assignment: { select: { courseId: true } } }
      }) : Promise.resolve([])
    ]);

    // Indexer les leçons par cours
    const lessonsByCourse = {};
    for (const lesson of allLessons) {
      if (!lessonsByCourse[lesson.courseId]) lessonsByCourse[lesson.courseId] = [];
      lessonsByCourse[lesson.courseId].push(lesson.id);
    }

    // Indexer les progressions par (studentId, lessonId)
    const completedSet = new Set(allProgresses.map(p => `${p.studentId}:${p.lessonId}`));

    // Calculer les stats par cours
    const result = courseIds.map(courseId => {
      const course = courseMap[courseId];
      const lessonIds = lessonsByCourse[courseId] || [];
      const studentIds = course.studentIds;

      let totalProgress = 0;
      let completedCount = 0;

      for (const studentId of studentIds) {
        const completed = lessonIds.filter(lId => completedSet.has(`${studentId}:${lId}`)).length;
        const rate = lessonIds.length > 0 ? (completed / lessonIds.length) * 100 : 0;
        totalProgress += rate;
        if (rate === 100) completedCount++;
      }

      const courseSubmissions = allSubmissions.filter(s => s.assignment.courseId === courseId);
      const avgScore = courseSubmissions.length > 0
        ? Math.round(courseSubmissions.reduce((acc, s) => acc + Number(s.grade), 0) / courseSubmissions.length)
        : 0;

      return {
        id: courseId,
        title: course.title,
        students: studentIds.length,
        completionRate: studentIds.length > 0 ? Math.round(totalProgress / studentIds.length) : 0,
        avgScore
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur récupération des cours." });
  }
};

/**
 * INSTRUCTEUR : Lister ses classes avec le cours et les chapitres associés
 * (utilisé notamment par l'interface d'import de Quiz Excel).
 */
export const getMyClassrooms = async (req, res) => {
  const instructorId = req.user.id;
  try {
    const classrooms = await prisma.classroom.findMany({
      where: { instructorId },
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            lessons: {
              orderBy: { sequenceOrder: 'asc' },
              select: { id: true, title: true, sequenceOrder: true },
            },
          },
        },
        _count: { select: { enrollments: true, quizzes: true } },
      },
    });

    return res.status(200).json(
      classrooms.map((c) => ({
        id: c.id,
        name: c.name,
        courseId: c.course.id,
        courseTitle: c.course.title,
        studentsCount: c._count.enrollments,
        quizzesCount: c._count.quizzes,
        lessons: c.course.lessons,
      }))
    );
  } catch (error) {
    console.error('[INSTRUCTOR] getMyClassrooms:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des classes.' });
  }
};

/**
 * INSTRUCTEUR : Ajouter un nouveau module/leçon à un de ses cours
 */
export const addLessonToCourse = async (req, res) => {
  const { courseId, title, videoUrl, documentUrl, sequenceOrder } = req.body;
  const instructorId = req.user.id;

  try {
    const classroom = await prisma.classroom.findFirst({
      where: { courseId, instructorId }
    });

    if (!classroom) {
      return res.status(403).json({ message: "Vous n'êtes pas assigné à ce cours." });
    }

    const newLesson = await prisma.moduleLesson.create({
      data: {
        courseId,
        title,
        videoUrl: videoUrl || null,
        documentUrl: documentUrl || null,
        sequenceOrder: sequenceOrder || 1
      }
    });

    return res.status(201).json({ message: "Leçon ajoutée avec succès.", lesson: newLesson });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur lors de l'ajout de la leçon." });
  }
};

/**
 * INSTRUCTEUR : Créer une nouvelle salle pour un cours
 */
export const createClassroom = async (req, res) => {
  const { courseId, name } = req.body;
  const instructorId = req.user.id;

  try {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ message: "Formation introuvable." });

    const newClassroom = await prisma.classroom.create({
      data: { name, courseId, instructorId }
    });

    return res.status(201).json({ message: "Salle créée avec succès", classroom: newClassroom });
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de la création de la salle." });
  }
};

/**
 * INSTRUCTEUR : Déplacer un étudiant d'une salle à une autre
 */
export const moveStudent = async (req, res) => {
  const { enrollmentId, newClassroomId } = req.body;
  const instructorId = req.user.id;

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { classroom: true }
    });

    if (!enrollment) return res.status(404).json({ message: "Inscription introuvable." });

    const targetClassroom = await prisma.classroom.findUnique({ where: { id: newClassroomId } });

    if (!targetClassroom || targetClassroom.instructorId !== instructorId) {
      return res.status(403).json({ message: "Vous n'avez pas l'autorisation pour cette salle." });
    }

    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { classroomId: newClassroomId }
    });

    return res.status(200).json({ message: "Étudiant déplacé avec succès", enrollment: updatedEnrollment });
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors du déplacement de l'étudiant." });
  }
};

/**
 * INSTRUCTEUR : Récupérer les étudiants d'une salle
 */
export const getClassroomStudents = async (req, res) => {
  const { courseId } = req.params;
  const instructorId = req.user.id;

  try {
    const classroom = await prisma.classroom.findFirst({
      where: { courseId, instructorId },
      include: {
        course: { select: { id: true, _count: { select: { lessons: true } } } },
        enrollments: {
          include: {
            student: {
              select: { id: true, nom: true, email: true }
            },
            course: {
              include: {
                lessons: {
                  include: {
                    progressions: true // to check isCompleted per student
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!classroom) {
      return res.status(404).json({ message: "Salle introuvable ou vous n'êtes pas assigné à ce cours." });
    }

    const studentsWithProgress = classroom.enrollments.map(enrollment => {
      const studentId = enrollment.studentId;
      const totalLessons = enrollment.course._count?.lessons || enrollment.course.lessons.length;
      
      let completedLessonsCount = 0;
      enrollment.course.lessons.forEach(lesson => {
        const studentProgress = lesson.progressions.find(p => p.studentId === studentId);
        if (studentProgress && studentProgress.isCompleted) {
          completedLessonsCount++;
        }
      });

      const progressRate = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;

      return {
        id: enrollment.student.id,
        nom: enrollment.student.nom,
        email: enrollment.student.email,
        enrollmentId: enrollment.id,
        paymentPlan: enrollment.paymentPlan,
        accessStatus: enrollment.accessStatus,
        progressRate
      };
    });

    return res.status(200).json(studentsWithProgress);
  } catch (error) {
    console.error("[INSTRUCTOR] Erreur getClassroomStudents:", error);
    return res.status(500).json({ message: "Erreur serveur lors de la récupération des étudiants." });
  }
};

// Stub for notification
const notifyStudentsForLiveSession = async (studentIds, sessionTitle, courseId) => {
  try {
    const notifications = studentIds.map(studentId => ({
      userId: studentId,
      type: 'SYSTEM',
      message: `Nouvelle session Live planifiée : ${sessionTitle}`,
    }));
    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }
  } catch (e) {
    console.error("[NOTIFICATION STUB] Failed to notify students:", e);
  }
};

/**
 * INSTRUCTEUR : Planifier une session Live Jitsi
 */
export const createLiveSession = async (req, res) => {
  const { courseId } = req.params;
  const { title, scheduledAt, duration } = req.body;
  const instructorId = req.user.id;

  try {
    const classroom = await prisma.classroom.findFirst({
      where: { courseId, instructorId },
      include: {
        enrollments: { select: { studentId: true } }
      }
    });

    if (!classroom) {
      return res.status(403).json({ message: "Vous n'êtes pas assigné à cette formation." });
    }

    // Salle Jitsi unique — jeton JWT émis par participant via GET /api/sessions/:id/join
    const jitsiUrl = buildRoomUrl(generateRoomName());

    // Notify students
    const studentIds = classroom.enrollments.map(e => e.studentId);
    const notifications = studentIds.map(studentId => ({
      userId: studentId,
      type: 'SYSTEM',
      message: `Nouvelle session Live planifiée : ${title}`,
    }));

    // Transaction Prisma : Créer la session ET notifier les élèves simultanément
    const [newSession] = await prisma.$transaction([
      prisma.liveSession.create({
        data: {
          courseId,
          instructorId,
          title,
          scheduledAt: new Date(scheduledAt),
          duration: parseInt(duration) || 120,
          jitsiUrl
        }
      }),
      ...(notifications.length > 0 
        ? [prisma.notification.createMany({ data: notifications })] 
        : [])
    ]);

    return res.status(201).json({
      message: "Session Live planifiée avec succès",
      session: newSession
    });
  } catch (error) {
    console.error("[INSTRUCTOR] Erreur createLiveSession:", error);
    return res.status(500).json({ message: "Erreur serveur lors de la création de la session." });
  }
};
