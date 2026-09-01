import express from 'express';
import { requireAuth, checkGlobalActivation, checkActiveEnrollmentForLesson } from '../middlewares/auth.middleware.js';
import { restrictToRole } from '../middlewares/role.middleware.js';
import { getMyDashboard, toggleLessonComplete } from '../controllers/student.controller.js';
import { getMyCertificates } from '../controllers/certificate.controller.js';
import { getMyAssignedQuizzes, getQuizForStudent } from '../controllers/quiz.controller.js';

const router = express.Router();

// Appliquer les middlewares de sécurité globaux à toutes les routes de l'étudiant
router.use(requireAuth);
router.use(restrictToRole(['STUDENT']));
router.use(checkGlobalActivation);

// Tableau de bord optimisé
router.get('/dashboard', getMyDashboard);

// Certificats (délivrance automatique si éligible : hoursSpent >= 85 + quiz validés)
router.get('/certificates', getMyCertificates);

// Quiz assignés (classe entière ou personnel) — la soumission se fait via POST /api/lessons/quiz/:id/submit
router.get('/quizzes', getMyAssignedQuizzes);
router.get('/quizzes/:id', getQuizForStudent);

// Marquer une leçon comme complétée (protégé spécifiquement par l'inscription active)
router.patch('/lessons/:lessonId/toggle', checkActiveEnrollmentForLesson, toggleLessonComplete);

export default router;
