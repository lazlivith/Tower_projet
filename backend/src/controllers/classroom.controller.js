import prisma from '../config/prisma.js';

/**
 * Espace de classe partagé (instructeur ↔ élèves).
 * - `/api/classrooms/mine`           : les classes de l'utilisateur courant
 * - `/api/classrooms/:id/messages`   : mur d'échange (lecture / publication / suppression)
 */

/**
 * Vérifie l'accès d'un utilisateur à une classe.
 * @returns {{ classroom, role: 'instructor'|'student', enrollmentStatus?: string }}
 * @throws  Error avec .status
 */
export async function resolveClassroomAccess(user, classroomId) {
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    include: { course: { select: { id: true, title: true } } },
  });
  if (!classroom) {
    const e = new Error('Classe introuvable.'); e.status = 404; throw e;
  }

  if (user.role === 'MANAGER') return { classroom, role: 'instructor' };
  if (user.role === 'INSTRUCTOR' && classroom.instructorId === user.id) {
    return { classroom, role: 'instructor' };
  }
  if (user.role === 'STUDENT') {
    const enr = await prisma.enrollment.findFirst({
      where: { classroomId, studentId: user.id },
      select: { accessStatus: true },
    });
    if (enr && enr.accessStatus === 'ACTIVE') {
      return { classroom, role: 'student', enrollmentStatus: enr.accessStatus };
    }
  }
  const e = new Error("Vous n'avez pas accès à cette classe."); e.status = 403; throw e;
}

/** GET /api/classrooms/mine — classes enseignées (instructeur) ou suivies (élève actif). */
export const getMyClassrooms = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    let classrooms;
    if (role === 'INSTRUCTOR' || role === 'MANAGER') {
      classrooms = await prisma.classroom.findMany({
        where: role === 'MANAGER' ? {} : { instructorId: userId },
        orderBy: { createdAt: 'desc' },
        include: {
          course: { select: { id: true, title: true } },
          instructor: { select: { id: true, nom: true } },
          _count: { select: { enrollments: true, messages: true } },
        },
      });
    } else {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: userId, accessStatus: 'ACTIVE' },
        include: {
          classroom: {
            include: {
              course: { select: { id: true, title: true } },
              instructor: { select: { id: true, nom: true } },
              _count: { select: { enrollments: true, messages: true } },
            },
          },
        },
      });
      classrooms = enrollments.map((e) => e.classroom);
    }

    return res.status(200).json(
      classrooms.map((c) => ({
        id: c.id,
        name: c.name,
        courseId: c.course.id,
        courseTitle: c.course.title,
        instructor: c.instructor,
        students: c._count.enrollments,
        messages: c._count.messages,
      }))
    );
  } catch (error) {
    console.error('[CLASSROOM] getMyClassrooms:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des classes.' });
  }
};

/** GET /api/classrooms/:classroomId/messages */
export const listMessages = async (req, res) => {
  try {
    const { classroom } = await resolveClassroomAccess(req.user, req.params.classroomId);
    const messages = await prisma.classMessage.findMany({
      where: { classroomId: classroom.id },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'asc' }],
      include: { author: { select: { id: true, nom: true, role: true } } },
    });
    return res.status(200).json({
      classroom: { id: classroom.id, name: classroom.name, courseTitle: classroom.course.title },
      messages,
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('[CLASSROOM] listMessages:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des messages.' });
  }
};

/** POST /api/classrooms/:classroomId/messages  body: { body, pinned? } */
export const postMessage = async (req, res) => {
  try {
    const { classroom, role } = await resolveClassroomAccess(req.user, req.params.classroomId);
    const body = String(req.body?.body ?? '').trim();
    if (body.length < 1) return res.status(400).json({ message: 'Message vide.' });
    if (body.length > 4000) return res.status(400).json({ message: 'Message trop long (4000 caractères max).' });

    const pinned = role === 'instructor' ? Boolean(req.body?.pinned) : false;

    const message = await prisma.classMessage.create({
      data: { classroomId: classroom.id, authorId: req.user.id, body, pinned },
      include: { author: { select: { id: true, nom: true, role: true } } },
    });

    // Notifier l'autre partie quand c'est l'instructeur qui publie
    if (role === 'instructor') {
      const students = await prisma.enrollment.findMany({
        where: { classroomId: classroom.id, accessStatus: 'ACTIVE' },
        select: { studentId: true },
      });
      if (students.length) {
        await prisma.notification.createMany({
          data: students.map((s) => ({
            userId: s.studentId,
            type: 'SYSTEM',
            message: `Nouveau message dans « ${classroom.name} »`,
          })),
        });
      }
    }

    return res.status(201).json(message);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('[CLASSROOM] postMessage:', error);
    return res.status(500).json({ message: "Erreur lors de l'envoi du message." });
  }
};

/** DELETE /api/classrooms/:classroomId/messages/:messageId — auteur ou instructeur de la classe. */
export const deleteMessage = async (req, res) => {
  try {
    const { classroom, role } = await resolveClassroomAccess(req.user, req.params.classroomId);
    const msg = await prisma.classMessage.findUnique({ where: { id: req.params.messageId } });
    if (!msg || msg.classroomId !== classroom.id) {
      return res.status(404).json({ message: 'Message introuvable.' });
    }
    if (msg.authorId !== req.user.id && role !== 'instructor') {
      return res.status(403).json({ message: 'Suppression non autorisée.' });
    }
    await prisma.classMessage.delete({ where: { id: msg.id } });
    return res.status(200).json({ message: 'Message supprimé.' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('[CLASSROOM] deleteMessage:', error);
    return res.status(500).json({ message: 'Erreur lors de la suppression.' });
  }
};
