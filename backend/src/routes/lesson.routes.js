import { Router } from 'express';
import { requireAuth, checkGlobalActivation } from '../middlewares/auth.middleware.js';
import { getLessonVideo, trackTimeSpent } from '../controllers/lesson.controller.js';
import { getLessonQuiz, submitQuiz } from '../controllers/quiz.controller.js';

const router = Router();

router.use(requireAuth, checkGlobalActivation);

// Quiz (routes statiques d'abord)
router.post('/quiz/:id/submit', submitQuiz);
router.get('/:lessonId/quiz', getLessonQuiz);

// Vidéo & suivi de présence
router.get('/:id/video', getLessonVideo);
router.post('/:id/track', trackTimeSpent);

export default router;
