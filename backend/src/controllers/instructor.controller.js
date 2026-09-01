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

const MEETING_PROVIDERS = ['jitsi', 'teams', 'zoom', 'meet', 'other'];

/** Devine le fournisseur à partir d'une URL de réunion. */
const guessProvider = (url = '') => {
  const u = url.toLowerCase();
  if (u.includes('teams.microsoft') || u.includes('teams.live')) return 'teams';
  if (u.includes('zoom.us')) return 'zoom';
  if (u.includes('meet.google')) return 'meet';
  if (u.includes('jit.si') || u.includes('8x8.vc')) return 'jitsi';
  return 'other';
};

/**
 * INSTRUCTEUR : Planifier une session en direct.
 * - `meetingUrl` fourni  → réunion externe (Teams / Zoom / Google Meet…).
 * - sinon                → salle Jitsi générée automatiquement.
 * Body : { title, scheduledAt, duration?, description?, meetingUrl?, provider? }
 */
export const createLiveSession = async (req, res) => {
  const { courseId } = req.params;
  const { title, scheduledAt, duration, description } = req.body;
  const instructorId = req.user.id;

  const meetingUrl = (req.body.meetingUrl || '').trim() || null;
  let provider = meetingUrl ? (req.body.provider || guessProvider(meetingUrl)) : 'jitsi';
  if (!MEETING_PROVIDERS.includes(provider)) provider = 'other';

  try {
    if (!title || !scheduledAt) {
      return res.status(400).json({ message: 'Les champs title et scheduledAt sont requis.' });
    }

    const classroom = await prisma.classroom.findFirst({
      where: { courseId, instructorId },
      include: { enrollments: { where: { accessStatus: 'ACTIVE' }, select: { studentId: true } } },
    });
    if (!classroom) {
      return res.status(403).json({ message: "Vous n'êtes pas assigné à cette formation." });
    }

    // Salle Jitsi de secours (toujours renseignée : la colonne est NOT NULL)
    const jitsiUrl = buildRoomUrl(generateRoomName());
    const notifications = classroom.enrollments.map((e) => ({
      userId: e.studentId,
      type: 'SYSTEM',
      message: `Nouvelle session « ${title} » planifiée le ${new Date(scheduledAt).toLocaleString('fr-FR')}`,
    }));

    const [session] = await prisma.$transaction([
      prisma.liveSession.create({
        data: {
          courseId, instructorId, title,
          description: description?.trim() || null,
          scheduledAt: new Date(scheduledAt),
          duration: parseInt(duration) || 120,
          jitsiUrl, meetingUrl, provider,
        },
      }),
      ...(notifications.length ? [prisma.notification.createMany({ data: notifications })] : []),
    ]);

    return res.status(201).json({ message: 'Session planifiée avec succès', session });
  } catch (error) {
    console.error('[INSTRUCTOR] createLiveSession:', error);
    return res.status(500).json({ message: 'Erreur serveur lors de la création de la session.' });
  }
};

// ──────────────────────────────────────────────────────────────
// Vérifie qu'un instructeur « enseigne » un cours (≥ 1 classe rattachée).
async function assertTeaches(instructorId, courseId) {
  const classroom = await prisma.classroom.findFirst({ where: { courseId, instructorId }, select: { id: true } });
  if (!classroom) { const e = new Error("Vous n'êtes pas assigné à cette formation."); e.status = 403; throw e; }
}

/** INSTRUCTEUR : synthèse de l'espace (KPIs + prochaines sessions + activité). */
export const getInstructorOverview = async (req, res) => {
  const instructorId = req.user.id;
  try {
    const classrooms = await prisma.classroom.findMany({
      where: { instructorId },
      include: {
        course: { select: { id: true, title: true } },
        _count: { select: { enrollments: true, messages: true } },
      },
    });
    const courseIds = [...new Set(classrooms.map((c) => c.course.id))];

    const [activeStudents, lessonsCount, upcoming, pendingSubs, lastMessages] = await Promise.all([
      prisma.enrollment.count({ where: { classroom: { instructorId }, accessStatus: 'ACTIVE' } }),
      prisma.moduleLesson.count({ where: { courseId: { in: courseIds.length ? courseIds : ['00000000-0000-0000-0000-000000000000'] } } }),
      prisma.liveSession.findMany({
        where: { instructorId, scheduledAt: { gte: new Date() } },
        orderBy: { scheduledAt: 'asc' }, take: 5,
        include: { course: { select: { title: true } } },
      }),
      prisma.submission.count({ where: { status: 'PENDING', assignment: { course: { classrooms: { some: { instructorId } } } } } }),
      prisma.classMessage.findMany({
        where: { classroom: { instructorId } },
        orderBy: { createdAt: 'desc' }, take: 5,
        include: { author: { select: { nom: true, role: true } }, classroom: { select: { name: true } } },
      }),
    ]);

    return res.status(200).json({
      kpis: {
        classes: classrooms.length,
        courses: courseIds.length,
        activeStudents,
        lessons: lessonsCount,
        upcomingSessions: upcoming.length,
        pendingSubmissions: pendingSubs,
        classMessages: classrooms.reduce((a, c) => a + c._count.messages, 0),
      },
      classes: classrooms.map((c) => ({
        id: c.id, name: c.name, courseId: c.course.id, courseTitle: c.course.title,
        students: c._count.enrollments,
      })),
      upcomingSessions: upcoming,
      recentMessages: lastMessages.map((m) => ({
        id: m.id, body: m.body, author: m.author.nom, role: m.author.role,
        classroom: m.classroom.name, createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error('[INSTRUCTOR] getInstructorOverview:', error);
    return res.status(500).json({ message: "Erreur lors du chargement de l'espace." });
  }
};

/** INSTRUCTEUR : leçons d'un cours qu'il enseigne (ordre + médias). */
export const listCourseLessons = async (req, res) => {
  const { courseId } = req.params;
  try {
    await assertTeaches(req.user.id, courseId);
    const lessons = await prisma.moduleLesson.findMany({
      where: { courseId },
      orderBy: { sequenceOrder: 'asc' },
      include: { _count: { select: { quizzes: true, progressions: true } } },
    });
    return res.status(200).json(
      lessons.map((l) => ({
        id: l.id, title: l.title, videoUrl: l.videoUrl, documentUrl: l.documentUrl,
        sequenceOrder: l.sequenceOrder, quizzes: l._count.quizzes, views: l._count.progressions,
      }))
    );
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('[INSTRUCTOR] listCourseLessons:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des leçons.' });
  }
};

/** INSTRUCTEUR : modifier une leçon. */
export const updateLesson = async (req, res) => {
  try {
    const lesson = await prisma.moduleLesson.findUnique({ where: { id: req.params.lessonId } });
    if (!lesson) return res.status(404).json({ message: 'Leçon introuvable.' });
    await assertTeaches(req.user.id, lesson.courseId);

    const data = {};
    if (typeof req.body.title === 'string' && req.body.title.trim()) data.title = req.body.title.trim();
    if ('videoUrl' in req.body) data.videoUrl = (req.body.videoUrl || '').trim() || null;
    if ('documentUrl' in req.body) data.documentUrl = (req.body.documentUrl || '').trim() || null;
    if (Number.isInteger(req.body.sequenceOrder)) data.sequenceOrder = req.body.sequenceOrder;

    const updated = await prisma.moduleLesson.update({ where: { id: lesson.id }, data });
    return res.status(200).json({ message: 'Leçon mise à jour.', lesson: updated });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('[INSTRUCTOR] updateLesson:', error);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour de la leçon.' });
  }
};

/** INSTRUCTEUR : supprimer une leçon. */
export const deleteLesson = async (req, res) => {
  try {
    const lesson = await prisma.moduleLesson.findUnique({ where: { id: req.params.lessonId } });
    if (!lesson) return res.status(404).json({ message: 'Leçon introuvable.' });
    await assertTeaches(req.user.id, lesson.courseId);
    await prisma.moduleLesson.delete({ where: { id: lesson.id } });
    return res.status(200).json({ message: 'Leçon supprimée.' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('[INSTRUCTOR] deleteLesson:', error);
    return res.status(500).json({ message: 'Erreur lors de la suppression de la leçon.' });
  }
};

/** INSTRUCTEUR : réordonner les leçons d'un cours. Body : { orderedIds: string[] } */
export const reorderLessons = async (req, res) => {
  const { courseId } = req.params;
  const { orderedIds } = req.body;
  try {
    await assertTeaches(req.user.id, courseId);
    if (!Array.isArray(orderedIds) || !orderedIds.length) {
      return res.status(400).json({ message: 'orderedIds (tableau) requis.' });
    }
    const lessons = await prisma.moduleLesson.findMany({ where: { courseId }, select: { id: true } });
    const known = new Set(lessons.map((l) => l.id));
    if (!orderedIds.every((id) => known.has(id))) {
      return res.status(400).json({ message: 'Un identifiant de leçon est invalide pour ce cours.' });
    }
    await prisma.$transaction(
      orderedIds.map((id, i) => prisma.moduleLesson.update({ where: { id }, data: { sequenceOrder: i + 1 } }))
    );
    return res.status(200).json({ message: 'Ordre des leçons mis à jour.' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('[INSTRUCTOR] reorderLessons:', error);
    return res.status(500).json({ message: 'Erreur lors du réordonnancement.' });
  }
};

/** INSTRUCTEUR : lister ses sessions (passées + à venir). */
export const listMySessions = async (req, res) => {
  try {
    const sessions = await prisma.liveSession.findMany({
      where: { instructorId: req.user.id },
      orderBy: { scheduledAt: 'asc' },
      include: { course: { select: { id: true, title: true } } },
    });
    return res.status(200).json(sessions);
  } catch (error) {
    console.error('[INSTRUCTOR] listMySessions:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des sessions.' });
  }
};

/** INSTRUCTEUR : modifier une session. */
export const updateSession = async (req, res) => {
  try {
    const session = await prisma.liveSession.findUnique({ where: { id: req.params.sessionId } });
    if (!session || session.instructorId !== req.user.id) {
      return res.status(404).json({ message: 'Session introuvable.' });
    }
    const data = {};
    if (typeof req.body.title === 'string' && req.body.title.trim()) data.title = req.body.title.trim();
    if ('description' in req.body) data.description = (req.body.description || '').trim() || null;
    if (req.body.scheduledAt) data.scheduledAt = new Date(req.body.scheduledAt);
    if (req.body.duration) data.duration = parseInt(req.body.duration) || session.duration;
    if ('meetingUrl' in req.body) {
      const url = (req.body.meetingUrl || '').trim() || null;
      data.meetingUrl = url;
      data.provider = url ? (req.body.provider || guessProvider(url)) : 'jitsi';
      if (!MEETING_PROVIDERS.includes(data.provider)) data.provider = 'other';
    }
    const updated = await prisma.liveSession.update({ where: { id: session.id }, data });
    return res.status(200).json({ message: 'Session mise à jour.', session: updated });
  } catch (error) {
    console.error('[INSTRUCTOR] updateSession:', error);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour de la session.' });
  }
};

/** INSTRUCTEUR : supprimer une session. */
export const deleteSession = async (req, res) => {
  try {
    const session = await prisma.liveSession.findUnique({ where: { id: req.params.sessionId } });
    if (!session || session.instructorId !== req.user.id) {
      return res.status(404).json({ message: 'Session introuvable.' });
    }
    await prisma.liveSession.delete({ where: { id: session.id } });
    return res.status(200).json({ message: 'Session supprimée.' });
  } catch (error) {
    console.error('[INSTRUCTOR] deleteSession:', error);
    return res.status(500).json({ message: 'Erreur lors de la suppression de la session.' });
  }
};
