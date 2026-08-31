import prisma from '../config/prisma.js';
// src/middlewares/classroom.middleware.js


export const verifyInstructorClassOwnership = async (req, res, next) => {
  const { classroomId } = req.params;
  const instructorId = req.user.id;

  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId }
    });

    if (!classroom) {
      return res.status(404).json({ message: "Classe virtuelle introuvable." });
    }

    // Sécurité : L'instructeur est-il le créateur de cette salle ?
    if (classroom.instructorId !== instructorId && req.user.role !== 'MANAGER') {
      return res.status(403).json({ message: "Action interdite : Vous n'êtes pas l'instructeur assigné à cette classe." });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de la vérification des droits de la classe." });
  }
};
