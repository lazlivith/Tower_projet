import prisma from '../config/prisma.js';
import jwt from 'jsonwebtoken';

// Réexport rétro-compatible : la logique de rôle vit désormais dans role.middleware.js
export { restrictToRole, requireRole } from './role.middleware.js';

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Accès non autorisé. Token manquant." });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Injecte les infos (ex: { id, role }) dans la requête
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalide ou expiré." });
  }
};

export const checkGlobalActivation = async (req, res, next) => {
  // req.user.id est extrait du jeton JWT décodé précédemment
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { isActive: true }
    });

    if (!user || !user.isActive) {
      return res.status(403).json({ 
        message: "Accès refusé : Votre compte a été suspendu par l'administrateur de TowerStructure." 
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de la vérification de l'état du compte." });
  }
};

export const checkActiveEnrollmentForLesson = async (req, res, next) => {
  const { lessonId } = req.params;
  
  if (!lessonId) return res.status(400).json({ message: "lessonId est requis." });

  try {
    const lesson = await prisma.moduleLesson.findUnique({
      where: { id: lessonId },
      select: { courseId: true }
    });

    if (!lesson) {
      return res.status(404).json({ message: "Leçon introuvable." });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: req.user.id,
          courseId: lesson.courseId
        }
      }
    });

    if (!enrollment || enrollment.accessStatus !== 'ACTIVE') {
      return res.status(403).json({ message: "Accès refusé. Vous devez avoir une inscription active à cette formation." });
    }

    req.courseId = lesson.courseId;
    next();
  } catch (error) {
    console.error("[AUTH MIDDLEWARE] Erreur checkActiveEnrollmentForLesson:", error);
    return res.status(500).json({ message: "Erreur serveur lors de la vérification de l'inscription." });
  }
};
