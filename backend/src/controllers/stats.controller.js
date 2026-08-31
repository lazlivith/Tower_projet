import prisma from '../config/prisma.js';

// STATS POUR L'ADMINISTRATEUR
export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const activeStudents = await prisma.user.count({ where: { role: 'STUDENT', isActive: true } });
    const totalCourses = await prisma.course.count();
    
    // Simplification des revenus : Somme des montants des paiements complétés
    const payments = await prisma.payment.findMany({ where: { paymentStatus: 'COMPLETED' } });
    const monthlyRevenue = payments.reduce((acc, p) => acc + Number(p.amount), 0);

    const totalPublications = await prisma.publication.count();
    const totalProjects = await prisma.project.count();
    const pendingQuotes = await prisma.quote.count({ where: { status: 'PENDING' } });
    
    const recentQuotes = await prisma.quote.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      totalUsers,
      activeStudents,
      totalCourses,
      monthlyRevenue,
      totalPublications,
      totalProjects,
      pendingQuotes,
      recentQuotes
    });
  } catch (error) {
    return res.status(500).json({ message: "Erreur statistiques admin." });
  }
};

// STATS POUR L'INSTRUCTEUR
export const getInstructorStats = async (req, res) => {
  const instructorId = req.user.id;
  try {
    const classrooms = await prisma.classroom.findMany({
      where: { instructorId },
      include: {
        enrollments: { where: { accessStatus: 'ACTIVE' } }
      }
    });

    const activeStudents = classrooms.reduce((acc, c) => acc + c.enrollments.length, 0);
    const assignedCourses = classrooms.length;

    const unreadMessages = await prisma.message.count({
      where: { receiverId: instructorId, isRead: false }
    });

    const pendingAssignments = await prisma.submission.count({
      where: {
        status: 'PENDING',
        assignment: { course: { classroom: { instructorId } } } // Relation simplifiée via la chaine
      }
    });

    return res.status(200).json({
      activeStudents,
      assignedCourses,
      unreadMessages,
      pendingAssignments
    });
  } catch (error) {
    return res.status(500).json({ message: "Erreur statistiques instructeur." });
  }
};

// STATS POUR L'ÉTUDIANT
export const getStudentStats = async (req, res) => {
  const studentId = req.user.id;
  try {
    const activeCourses = await prisma.enrollment.count({
      where: { studentId, accessStatus: 'ACTIVE' }
    });

    const certificates = await prisma.certificate.count({
      where: { studentId }
    });

    // Progression globale = Moyenne des progressions des modules (simplifié)
    const progressLines = await prisma.progress.findMany({ where: { studentId } });
    const completed = progressLines.filter(p => p.isCompleted).length;
    const progressRate = progressLines.length > 0 ? Math.round((completed / progressLines.length) * 100) : 0;

    return res.status(200).json({
      activeCourses,
      certificates,
      progressRate
    });
  } catch (error) {
    return res.status(500).json({ message: "Erreur statistiques étudiant." });
  }
};
