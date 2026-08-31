import { generateCertificatePDF } from '../services/pdf.service.js';
import prisma from '../config/prisma.js';
import { onboardInstructorService } from '../services/admin.service.js';

export const getUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [total, users] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
        include: {
          certificates: true,
          enrollments: { include: { course: true, payments: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    ]);

    const formattedUsers = users.map(user => {
      let status = 'EN RÈGLE';
      let isAlumni = user.certificates.length > 0;
      
      if (user.role === 'STUDENT' && user.enrollments.some(e => e.accessStatus === 'SUSPENDED')) {
        status = 'EN RETARD';
      }

      return {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isAlumni,
        studentStatus: status,
        enrollments: user.enrollments,
        certificatesCount: user.certificates.length
      };
    });

    return res.status(200).json({
      data: formattedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    return res.status(500).json({ message: "Erreur récupération utilisateurs." });
  }
};

export const toggleUserStatus = async (req, res) => {
  const { userId } = req.params;
  const { action } = req.body; // 'BLOCK' ou 'UNBLOCK'

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    const newActiveState = action === 'UNBLOCK';

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: newActiveState },
      select: { id: true, nom: true, email: true, role: true, isActive: true }
    });

    const statusMessage = newActiveState ? "réactivé" : "bloqué";
    return res.status(200).json({ 
      message: `Le compte de l'utilisateur ${updatedUser.nom} a été ${statusMessage} avec succès.`,
      user: updatedUser
    });

  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de la modification du statut de l'utilisateur." });
  }
};

export const toggleEnrollmentStatus = async (req, res) => {
  const { enrollmentId } = req.params;
  const { status } = req.body; // 'ACTIVE', 'SUSPENDED'

  try {
    const enrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { accessStatus: status }
    });

    return res.status(200).json({ 
      message: `Accès modifié avec succès. Nouveau statut: ${status}`,
      enrollment 
    });
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de la modification de l'accès à la formation." });
  }
};



export const enrollStudentInClass = async (req, res) => {
  const { studentId, courseId, paymentPlan } = req.body;

  try {
    const student = await prisma.user.findUnique({
      where: { id: studentId }
    });

    if (!student || student.role !== 'STUDENT') {
      return res.status(404).json({ message: "L'utilisateur spécifié n'est pas un étudiant valide." });
    }

    if (!student.isActive) {
      return res.status(403).json({ message: "Impossible d'inscrire un étudiant dont le compte est bloqué." });
    }

    // Rechercher la salle associée au cours
    // Si plusieurs classes existent, l'admin doit préciser classroomId dans le body
    let classroom;
    if (req.body.classroomId) {
      classroom = await prisma.classroom.findUnique({ where: { id: req.body.classroomId } });
    } else {
      const classrooms = await prisma.classroom.findMany({ where: { courseId } });
      if (classrooms.length > 1) {
        return res.status(400).json({
          message: `Cette formation a ${classrooms.length} classes. Veuillez préciser le champ 'classroomId' dans votre requête.`,
          classrooms: classrooms.map(c => ({ id: c.id, name: c.name }))
        });
      }
      classroom = classrooms[0];
    }

    if (!classroom) {
      return res.status(404).json({ message: "Aucune classe virtuelle n'a encore été configurée pour cette formation." });
    }

    let nextPaymentDue = null;
    if (paymentPlan === 'THREE_INSTALLMENTS') {
      nextPaymentDue = new Date();
      nextPaymentDue.setDate(nextPaymentDue.getDate() + 20);
    }

    const newEnrollment = await prisma.enrollment.create({
      data: {
        studentId: student.id,
        courseId: courseId,
        classroomId: classroom.id,
        paymentPlan: paymentPlan,
        accessStatus: 'ACTIVE',
        nextPaymentDue: nextPaymentDue
      },
      include: {
        classroom: true,
        course: true
      }
    });

    const lessons = await prisma.moduleLesson.findMany({
      where: { courseId: courseId }
    });

    if (lessons.length > 0) {
      const progressData = lessons.map(lesson => ({
        studentId: student.id,
        lessonId: lesson.id,
        isCompleted: false
      }));

      await prisma.progress.createMany({
        data: progressData,
        skipDuplicates: true
      });
    }

    return res.status(201).json({
      message: `L'étudiant ${student.nom} a été inscrit avec succès dans la classe : ${classroom.name}`,
      enrollment: newEnrollment
    });

  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ message: "Cet étudiant est déjà inscrit à cette formation." });
    }
    return res.status(500).json({ message: "Erreur lors du traitement de l'inscription de l'élève." });
  }
};

export const validateCertificate = async (req, res) => {
  const { studentId, courseId } = req.body;

  try {
    const student = await prisma.user.findUnique({ where: { id: studentId } });
    const course = await prisma.course.findUnique({ where: { id: courseId } });

    if (!student || !course) {
      return res.status(404).json({ message: "Utilisateur ou formation introuvable." });
    }

    const submissions = await prisma.submission.findMany({
      where: { studentId, assignment: { courseId }, status: 'GRADED' }
    });

    const totalGrade = submissions.reduce((acc, sub) => acc + Number(sub.grade), 0);
    const score = submissions.length > 0 ? (totalGrade / submissions.length).toFixed(2) : 100;

    const pdfUrl = await generateCertificatePDF(student, course, score);

    const certificate = await prisma.certificate.create({
      data: {
        studentId,
        courseId,
        pdfUrl,
        score
      }
    });

    return res.status(201).json({ message: "Certificat généré avec succès.", certificate });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur lors de la génération du certificat." });
  }
};

/**


// ─────────────────────────────────────────────────────────────────
// NOUVEAUX ENDPOINTS
// ─────────────────────────────────────────────────────────────────

/**
 * ADMIN — Onboarding complet d'un Instructeur (Transaction)
 * - Création du compte INSTRUCTOR
 * - Assignation à une Classroom et Course
 * - Envoi des identifiants par email
 */
export const onboardInstructor = async (req, res) => {
  try {
    const result = await onboardInstructorService(req.body);
    return res.status(201).json({
      message: "Instructeur créé et assigné avec succès.",
      data: result
    });
  } catch (error) {
    console.error("[ONBOARDING ERROR]", error);
    const msg = error.message || "";
    let statusCode = 500;
    if (msg.includes("requis") || msg.includes("existe déjà")) statusCode = 400;
    else if (msg.includes("introuvable")) statusCode = 404;
    return res.status(statusCode).json({ message: msg || "Erreur lors de l'onboarding de l'instructeur." });
  }
};

/**
 * ADMIN — Assigner un instructeur à une formation (met à jour la Classroom liée)
 */
export const assignInstructorToCourse = async (req, res) => {
  const { courseId } = req.params;
  const { instructorId } = req.body;

  if (!instructorId) {
    return res.status(400).json({ message: "L'ID de l'instructeur est requis." });
  }

  try {
    const course = await prisma.course.findUnique({ where: { id: courseId }, include: { classrooms: true } });
    if (!course) return res.status(404).json({ message: "Formation introuvable." });

    const instructor = await prisma.user.findUnique({ where: { id: instructorId } });
    if (!instructor || instructor.role !== 'INSTRUCTOR') {
      return res.status(404).json({ message: "Instructeur introuvable ou rôle incorrect." });
    }

    // Met à jour toutes les classes de ce cours avec le nouvel instructeur
    await prisma.classroom.updateMany({
      where: { courseId },
      data: { instructorId }
    });

    return res.status(200).json({
      message: `Instructeur ${instructor.nom} assigné à la formation "${course.title}" avec succès.`
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur lors de l'assignation de l'instructeur." });
  }
};

/**
 * ADMIN — Récupérer la liste des inscriptions en attente d'activation
 */
export const getPendingEnrollments = async (req, res) => {
  try {
    const pendingEnrollments = await prisma.enrollment.findMany({
      where: { accessStatus: 'PENDING' },
      include: {
        student: { select: { id: true, nom: true, email: true } },
        course: { select: { id: true, title: true, price: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(pendingEnrollments);
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de la récupération des inscriptions en attente." });
  }
};

/**
 * ADMIN — Valider manuellement l'accès d'un étudiant à une formation (paiement simulé)
 */
export const validateEnrollmentAccess = async (req, res) => {
  const { enrollmentId } = req.params;
  try {
    const enrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { accessStatus: 'ACTIVE' },
      include: {
        student: { select: { nom: true, email: true } },
        course: { select: { title: true } }
      }
    });

    return res.status(200).json({
      message: `Accès de ${enrollment.student.nom} à "${enrollment.course.title}" activé avec succès.`,
      enrollment
    });
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de la validation de l'accès." });
  }
};
