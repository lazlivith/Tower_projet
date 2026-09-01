import bcrypt from 'bcrypt';
import crypto from 'crypto';
import prisma from '../config/prisma.js';
import { sendMail } from '../services/mail.service.js';
import { instructorOnboardingEmail } from '../services/mail.templates.js';

/**
 * Back-office « Académie & Suivi » (MANAGER).
 * Endpoints en lecture pour le suivi global + gestion des instructeurs et des
 * classes en ligne (une formation = plusieurs classes, chacune avec un formateur).
 * Aucune migration : on s'appuie sur les modèles existants (Course, Classroom,
 * ModuleLesson, Enrollment, Payment, User).
 */

const LOGIN_URL = () => `${process.env.FRONTEND_URL || 'http://localhost:5173'}/learn/login`;

// ──────────────────────────────────────────────────────────────
// SUIVI GLOBAL DE LA PLATEFORME
// ──────────────────────────────────────────────────────────────
export const getOverview = async (req, res) => {
  try {
    const [
      usersByRole,
      totalCourses,
      publishedCourses,
      totalClassrooms,
      classroomsNoInstructor,
      totalLessons,
      lessonsWithVideo,
      enrollmentsByStatus,
      completedPayments,
      pendingQuotes,
      publications,
      projects,
      recentUsers,
      recentPayments,
      recentEnrollments,
    ] = await Promise.all([
      prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
      prisma.course.count(),
      prisma.course.count({ where: { isPublished: true } }),
      prisma.classroom.count(),
      prisma.classroom.count({ where: { instructorId: null } }),
      prisma.moduleLesson.count(),
      prisma.moduleLesson.count({ where: { NOT: [{ videoUrl: null }, { videoUrl: '' }] } }),
      prisma.enrollment.groupBy({ by: ['accessStatus'], _count: { _all: true } }),
      prisma.payment.findMany({ where: { paymentStatus: 'COMPLETED' }, select: { amount: true, createdAt: true } }),
      prisma.quote.count({ where: { status: 'PENDING' } }),
      prisma.publication.count(),
      prisma.project.count(),
      prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 6, select: { id: true, nom: true, email: true, role: true, isActive: true, createdAt: true } }),
      prisma.payment.findMany({
        orderBy: { createdAt: 'desc' }, take: 6,
        select: {
          id: true, amount: true, paymentMethod: true, paymentStatus: true, createdAt: true,
          enrollment: { select: { student: { select: { nom: true } }, course: { select: { title: true } } } },
        },
      }),
      prisma.enrollment.findMany({
        orderBy: { createdAt: 'desc' }, take: 6,
        select: {
          id: true, accessStatus: true, createdAt: true,
          student: { select: { nom: true } }, course: { select: { title: true } },
        },
      }),
    ]);

    const roleCount = Object.fromEntries(usersByRole.map((r) => [r.role, r._count._all]));
    const enrollCount = Object.fromEntries(enrollmentsByStatus.map((e) => [e.accessStatus, e._count._all]));
    const revenueTotal = completedPayments.reduce((acc, p) => acc + Number(p.amount), 0);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const revenueMonth = completedPayments
      .filter((p) => p.createdAt >= monthStart)
      .reduce((acc, p) => acc + Number(p.amount), 0);

    return res.status(200).json({
      users: {
        total: usersByRole.reduce((a, r) => a + r._count._all, 0),
        students: roleCount.STUDENT || 0,
        instructors: roleCount.INSTRUCTOR || 0,
        managers: roleCount.MANAGER || 0,
      },
      academy: {
        totalCourses,
        publishedCourses,
        totalClassrooms,
        classroomsNoInstructor,
        totalLessons,
        lessonsWithVideo,
      },
      enrollments: {
        active: enrollCount.ACTIVE || 0,
        suspended: enrollCount.SUSPENDED || 0,
        completed: enrollCount.COMPLETED || 0,
        total: enrollmentsByStatus.reduce((a, e) => a + e._count._all, 0),
      },
      revenue: { total: revenueTotal, month: revenueMonth, currency: 'MAD' },
      vitrine: { publications, projects, pendingQuotes },
      recent: {
        users: recentUsers,
        payments: recentPayments.map((p) => ({
          id: p.id, amount: Number(p.amount), method: p.paymentMethod, status: p.paymentStatus,
          createdAt: p.createdAt, student: p.enrollment?.student?.nom ?? '—', course: p.enrollment?.course?.title ?? '—',
        })),
        enrollments: recentEnrollments.map((e) => ({
          id: e.id, status: e.accessStatus, createdAt: e.createdAt,
          student: e.student?.nom ?? '—', course: e.course?.title ?? '—',
        })),
      },
    });
  } catch (error) {
    console.error('[ADMIN] getOverview:', error);
    return res.status(500).json({ message: 'Erreur lors du chargement du suivi global.' });
  }
};

// ──────────────────────────────────────────────────────────────
// FORMATIONS + CLASSES + CONTENU (vue back-office)
// ──────────────────────────────────────────────────────────────
export const getCourses = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        classrooms: {
          orderBy: { createdAt: 'asc' },
          include: {
            instructor: { select: { id: true, nom: true, email: true } },
            _count: { select: { enrollments: true } },
          },
        },
        lessons: {
          orderBy: { sequenceOrder: 'asc' },
          select: { id: true, title: true, videoUrl: true, documentUrl: true, sequenceOrder: true },
        },
        _count: { select: { enrollments: true, lessons: true, classrooms: true } },
      },
    });

    return res.status(200).json(
      courses.map((c) => ({
        id: c.id,
        title: c.title,
        level: c.level,
        price: Number(c.price),
        priceLabel: c.priceLabel,
        durationHours: c.durationHours,
        imageUrl: c.imageUrl,
        isPublished: c.isPublished,
        objectives: c.objectives ?? [],
        syllabus: c.syllabus ?? [],
        counts: {
          students: c._count.enrollments,
          lessons: c._count.lessons,
          classrooms: c._count.classrooms,
          videos: c.lessons.filter((l) => l.videoUrl).length,
        },
        classrooms: c.classrooms.map((cl) => ({
          id: cl.id,
          name: cl.name,
          students: cl._count.enrollments,
          instructor: cl.instructor,
        })),
        lessons: c.lessons,
      }))
    );
  } catch (error) {
    console.error('[ADMIN] getCourses:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des formations.' });
  }
};

/** Détail d'une formation : programme + toutes les leçons/vidéos + classes & élèves. */
export const getCourseContent = async (req, res) => {
  const { courseId } = req.params;
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: {
          orderBy: { sequenceOrder: 'asc' },
          include: { _count: { select: { quizzes: true } } },
        },
        classrooms: {
          orderBy: { createdAt: 'asc' },
          include: {
            instructor: { select: { id: true, nom: true, email: true } },
            enrollments: {
              include: { student: { select: { id: true, nom: true, email: true } } },
            },
          },
        },
      },
    });

    if (!course) return res.status(404).json({ message: 'Formation introuvable.' });

    return res.status(200).json({
      id: course.id,
      title: course.title,
      description: course.description,
      level: course.level,
      durationHours: course.durationHours,
      priceLabel: course.priceLabel,
      audience: course.audience,
      prerequisites: course.prerequisites,
      objectives: course.objectives ?? [],
      syllabus: course.syllabus ?? [],
      lessons: course.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        videoUrl: l.videoUrl,
        documentUrl: l.documentUrl,
        sequenceOrder: l.sequenceOrder,
        quizzes: l._count.quizzes,
      })),
      classrooms: course.classrooms.map((cl) => ({
        id: cl.id,
        name: cl.name,
        instructor: cl.instructor,
        students: cl.enrollments.map((e) => ({
          id: e.student.id,
          nom: e.student.nom,
          email: e.student.email,
          accessStatus: e.accessStatus,
        })),
      })),
    });
  } catch (error) {
    console.error('[ADMIN] getCourseContent:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération du contenu de la formation.' });
  }
};

// ──────────────────────────────────────────────────────────────
// INSTRUCTEURS
// ──────────────────────────────────────────────────────────────
export const getInstructors = async (req, res) => {
  try {
    const instructors = await prisma.user.findMany({
      where: { role: 'INSTRUCTOR' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, nom: true, email: true, isActive: true, isFirstLogin: true, createdAt: true,
        classrooms: {
          select: {
            id: true, name: true,
            course: { select: { id: true, title: true } },
            _count: { select: { enrollments: true } },
          },
        },
      },
    });

    return res.status(200).json(
      instructors.map((i) => ({
        id: i.id,
        nom: i.nom,
        email: i.email,
        isActive: i.isActive,
        pendingFirstLogin: i.isFirstLogin,
        createdAt: i.createdAt,
        classes: i.classrooms.map((c) => ({
          id: c.id, name: c.name, courseId: c.course.id, courseTitle: c.course.title, students: c._count.enrollments,
        })),
        coursesCount: new Set(i.classrooms.map((c) => c.course.id)).size,
        studentsCount: i.classrooms.reduce((a, c) => a + c._count.enrollments, 0),
      }))
    );
  } catch (error) {
    console.error('[ADMIN] getInstructors:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des instructeurs.' });
  }
};

/**
 * Créer un compte instructeur. L'assignation à une formation / classe est
 * optionnelle. L'email d'identifiants est envoyé mais son échec n'annule pas
 * la création (contrairement à /admin/instructors/onboard).
 */
export const createInstructor = async (req, res) => {
  const { nom, email } = req.body;
  const courseId = req.body.courseId || null;
  const classroomId = req.body.classroomId || null;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà.' });

    const tempPassword = crypto.randomBytes(6).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const instructor = await prisma.user.create({
      data: { nom, email, passwordHash, role: 'INSTRUCTOR', isActive: true, isFirstLogin: true },
      select: { id: true, nom: true, email: true, role: true, isActive: true },
    });

    let classroom = null;
    let courseTitle = null;

    if (classroomId) {
      classroom = await prisma.classroom.update({
        where: { id: classroomId },
        data: { instructorId: instructor.id },
        include: { course: { select: { title: true } } },
      });
      courseTitle = classroom.course.title;
    } else if (courseId) {
      const course = await prisma.course.findUnique({ where: { id: courseId }, select: { title: true } });
      if (course) {
        courseTitle = course.title;
        const existingClass = await prisma.classroom.findFirst({ where: { courseId, instructorId: null } });
        classroom = existingClass
          ? await prisma.classroom.update({ where: { id: existingClass.id }, data: { instructorId: instructor.id } })
          : await prisma.classroom.create({
              data: { name: `Classe ${new Date().getFullYear()} - ${course.title}`, courseId, instructorId: instructor.id },
            });
      }
    }

    const mailSent = await sendMail({
      to: email,
      subject: 'Vos identifiants Instructeur — Tower Structure',
      html: instructorOnboardingEmail({
        nom, email, tempPassword,
        courseTitle: courseTitle || 'À assigner ultérieurement',
        classroomName: classroom?.name || '—',
        loginUrl: LOGIN_URL(),
      }),
      throwOnError: false,
    });

    return res.status(201).json({
      message: `Instructeur ${instructor.nom} créé.${mailSent ? ' Identifiants envoyés par email.' : ' (email non envoyé — voir logs SMTP)'}`,
      instructor,
      classroom: classroom ? { id: classroom.id, name: classroom.name } : null,
      tempPassword: mailSent ? undefined : tempPassword, // dépannage si SMTP KO
    });
  } catch (error) {
    console.error('[ADMIN] createInstructor:', error);
    return res.status(500).json({ message: "Erreur lors de la création de l'instructeur." });
  }
};

// ──────────────────────────────────────────────────────────────
// CLASSES EN LIGNE (CLASSROOMS)
// ──────────────────────────────────────────────────────────────
export const createClassroom = async (req, res) => {
  const { courseId, name } = req.body;
  const instructorId = req.body.instructorId || null;
  try {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ message: 'Formation introuvable.' });

    if (instructorId) {
      const instr = await prisma.user.findUnique({ where: { id: instructorId } });
      if (!instr || instr.role !== 'INSTRUCTOR') {
        return res.status(400).json({ message: 'Instructeur introuvable ou rôle incorrect.' });
      }
    }

    const classroom = await prisma.classroom.create({
      data: { courseId, name, instructorId },
      include: { instructor: { select: { id: true, nom: true, email: true } } },
    });
    return res.status(201).json({ message: `Classe « ${classroom.name} » créée.`, classroom });
  } catch (error) {
    console.error('[ADMIN] createClassroom:', error);
    return res.status(500).json({ message: 'Erreur lors de la création de la classe.' });
  }
};

export const updateClassroom = async (req, res) => {
  const { classroomId } = req.params;
  const data = {};
  if (typeof req.body.name === 'string') data.name = req.body.name;
  if ('instructorId' in req.body) {
    const raw = req.body.instructorId;
    data.instructorId = raw ? raw : null; // '' ou null => désassignation
  }

  try {
    if (data.instructorId) {
      const instr = await prisma.user.findUnique({ where: { id: data.instructorId } });
      if (!instr || instr.role !== 'INSTRUCTOR') {
        return res.status(400).json({ message: 'Instructeur introuvable ou rôle incorrect.' });
      }
    }

    const classroom = await prisma.classroom.update({
      where: { id: classroomId },
      data,
      include: {
        instructor: { select: { id: true, nom: true, email: true } },
        _count: { select: { enrollments: true } },
      },
    });
    return res.status(200).json({ message: 'Classe mise à jour.', classroom });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Classe introuvable.' });
    console.error('[ADMIN] updateClassroom:', error);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour de la classe.' });
  }
};

export const deleteClassroom = async (req, res) => {
  const { classroomId } = req.params;
  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      include: { _count: { select: { enrollments: true } } },
    });
    if (!classroom) return res.status(404).json({ message: 'Classe introuvable.' });
    if (classroom._count.enrollments > 0) {
      return res.status(400).json({
        message: `Impossible de supprimer : ${classroom._count.enrollments} élève(s) inscrit(s). Déplacez-les d'abord.`,
      });
    }
    await prisma.classroom.delete({ where: { id: classroomId } });
    return res.status(200).json({ message: 'Classe supprimée.' });
  } catch (error) {
    console.error('[ADMIN] deleteClassroom:', error);
    return res.status(500).json({ message: 'Erreur lors de la suppression de la classe.' });
  }
};
