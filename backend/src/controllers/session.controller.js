import prisma from '../config/prisma.js';
import { generateRoomName, buildRoomUrl, buildJoinUrl } from '../services/jitsi.service.js';

/**
 * Planifier une nouvelle session en direct (Réservé INSTRUCTOR)
 */
export const scheduleSession = async (req, res) => {
  try {
    const instructorId = req.user.id;
    const { courseId, title, scheduledAt } = req.body;

    if (!courseId || !title || !scheduledAt) {
      return res.status(400).json({ message: "Les champs courseId, title et scheduledAt sont requis." });
    }

    // Vérifier si le cours existe
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ message: "Cours introuvable." });
    }

    // Salle Jitsi unique — l'URL stockée est la salle de base ; le jeton JWT est émis
    // par participant au moment de rejoindre (GET /api/sessions/:id/join).
    const room = generateRoomName();
    const jitsiUrl = buildRoomUrl(room);

    // Enregistrement dans la base de données
    const session = await prisma.liveSession.create({
      data: {
        courseId,
        instructorId,
        title,
        jitsiUrl,
        scheduledAt: new Date(scheduledAt)
      }
    });

    // Notifier tous les étudiants actifs inscrits à ce cours
    const activeEnrollments = await prisma.enrollment.findMany({
      where: { courseId, accessStatus: 'ACTIVE' },
      select: { studentId: true }
    });

    if (activeEnrollments.length > 0) {
      const notifications = activeEnrollments.map(e => ({
        userId: e.studentId,
        type: 'SYSTEM',
        message: `Une nouvelle session live "${title}" a été programmée pour le ${new Date(scheduledAt).toLocaleString('fr-FR')}.`
      }));
      await prisma.notification.createMany({ data: notifications });
    }

    return res.status(201).json({
      message: "Session planifiée avec succès.",
      session
    });
  } catch (error) {
    console.error("[SESSION] Erreur lors de la planification :", error);
    return res.status(500).json({ message: "Erreur serveur lors de la planification de la session." });
  }
};

/**
 * Récupérer la liste des cours en direct programmés pour un étudiant
 */
export const getUpcomingSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Trouver les cours auxquels l'étudiant est inscrit et actif
    const activeEnrollments = await prisma.enrollment.findMany({
      where: {
        studentId: userId,
        accessStatus: 'ACTIVE'
      },
      select: { courseId: true }
    });

    const activeCourseIds = activeEnrollments.map(e => e.courseId);

    if (activeCourseIds.length === 0) {
      return res.status(200).json([]);
    }

    // 2. Récupérer les sessions futures pour ces cours
    const upcomingSessions = await prisma.liveSession.findMany({
      where: {
        courseId: { in: activeCourseIds },
        scheduledAt: { gte: new Date() } // Uniquement les sessions futures
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        course: { select: { title: true } },
        instructor: { select: { nom: true } }
      }
    });

    return res.status(200).json(upcomingSessions);
  } catch (error) {
    console.error("[SESSION] Erreur récupération sessions :", error);
    return res.status(500).json({ message: "Erreur serveur lors de la récupération des sessions." });
  }
};

/**
 * Rejoindre une session : renvoie l'URL Jitsi avec un jeton JWT propre au participant.
 * Modérateur si l'appelant est l'instructeur de la session (ou un MANAGER).
 * L'étudiant doit avoir une inscription ACTIVE au cours.
 */
export const joinLiveSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const session = await prisma.liveSession.findUnique({
      where: { id: req.params.id },
      include: { instructor: { select: { id: true, nom: true, email: true } } },
    });
    if (!session) return res.status(404).json({ message: 'Session introuvable.' });

    const isModerator = req.user.role === 'MANAGER' || session.instructorId === userId;

    if (!isModerator) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: userId, courseId: session.courseId } },
        select: { accessStatus: true },
      });
      if (!enrollment || enrollment.accessStatus !== 'ACTIVE') {
        return res.status(403).json({ message: "Accès refusé à cette session." });
      }
    }

    // Réunion externe (Teams / Zoom / Meet) : on renvoie le lien tel quel.
    if (session.meetingUrl) {
      return res.status(200).json({
        sessionId: session.id,
        title: session.title,
        scheduledAt: session.scheduledAt,
        moderator: isModerator,
        external: true,
        provider: session.provider || 'other',
        url: session.meetingUrl,
      });
    }

    const me = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, nom: true, email: true } });
    // Le nom de salle est le dernier segment de l'URL stockée
    const room = session.jitsiUrl.split('/').pop();
    const join = buildJoinUrl({ room, user: me, moderator: isModerator });

    return res.status(200).json({
      sessionId: session.id,
      title: session.title,
      scheduledAt: session.scheduledAt,
      moderator: isModerator,
      external: false,
      provider: 'jitsi',
      ...join,
    });
  } catch (error) {
    console.error('[SESSION] joinLiveSession:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

/**
 * Récupérer la liste des cours en direct programmés par un instructeur
 */
export const getInstructorSessions = async (req, res) => {
  try {
    const instructorId = req.user.id;
    const upcomingSessions = await prisma.liveSession.findMany({
      where: { instructorId },
      orderBy: { scheduledAt: 'asc' },
      include: { course: { select: { title: true } } }
    });
    return res.status(200).json(upcomingSessions);
  } catch (error) {
    console.error("[SESSION] Erreur récupération sessions instructeur :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};
