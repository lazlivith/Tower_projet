import prisma from '../config/prisma.js';

// INSTRUCTEUR: Récupérer les devoirs à corriger
export const getPendingSubmissions = async (req, res) => {
  const instructorId = req.user.id;
  try {
    const submissions = await prisma.submission.findMany({
      where: { 
        status: 'PENDING',
        assignment: {
          course: {
            classrooms: {
              some: { instructorId }
            }
          }
        }
      },
      include: {
        student: { select: { nom: true, email: true } },
        assignment: { select: { title: true, course: { select: { title: true } } } }
      }
    });
    return res.status(200).json(submissions);
  } catch (error) {
    return res.status(500).json({ message: "Erreur récupération des soumissions." });
  }
};

// INSTRUCTEUR: Corriger et noter un devoir
export const gradeSubmission = async (req, res) => {
  const { submissionId } = req.params;
  const { grade } = req.body;
  try {
    const submission = await prisma.submission.update({
      where: { id: submissionId },
      data: { grade, status: 'GRADED' }
    });
    
    // Notifier l'étudiant
    await prisma.notification.create({
      data: {
        userId: submission.studentId,
        type: 'GRADE',
        message: `Votre devoir a été corrigé. Note : ${grade}/100`
      }
    });

    return res.status(200).json(submission);
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de la notation." });
  }
};

// ÉLÈVE: Soumettre un devoir
export const submitAssignment = async (req, res) => {
  const studentId = req.user.id;
  const { assignmentId, fileUrl } = req.body;
  try {
    const submission = await prisma.submission.create({
      data: { assignmentId, studentId, fileUrl }
    });
    return res.status(201).json(submission);
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de la soumission." });
  }
};
