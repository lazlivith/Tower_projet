import { Router } from 'express';
import { getCourseById, getMyCourses, getCourseLessons, markLessonComplete } from '../controllers/course.controller.js';
import { getPublishedCourses } from '../controllers/cms.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Endpoint public : catalogue vitrine
router.get('/', getPublishedCourses);

// Récupération des cours de l'étudiant (Sécurisé) - Doit être avant /:id
router.get('/my-courses', requireAuth, getMyCourses);

router.get('/:id', getCourseById);

// Récupération des leçons d'un cours (Sécurisé : vérification Enrollment)
router.get('/:id/lessons', requireAuth, getCourseLessons);

// Mise à jour de la progression (Cocher une leçon terminée)
router.post('/:id/progress', requireAuth, markLessonComplete);

export default router;
