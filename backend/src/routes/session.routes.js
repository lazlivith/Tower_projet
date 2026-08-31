import { Router } from 'express';
import { scheduleSession, getUpcomingSessions, getInstructorSessions, joinLiveSession } from '../controllers/session.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { restrictToRole } from '../middlewares/role.middleware.js';

const router = Router();

// Planifier une session (Réservé INSTRUCTOR)
router.post('/schedule', requireAuth, restrictToRole(['INSTRUCTOR', 'MANAGER']), scheduleSession);

// Récupérer les sessions de l'instructeur
router.get('/instructor', requireAuth, restrictToRole(['INSTRUCTOR', 'MANAGER']), getInstructorSessions);

// Récupérer les sessions à venir (Étudiants)
router.get('/upcoming', requireAuth, getUpcomingSessions);

// Rejoindre une session — renvoie l'URL Jitsi + jeton JWT propre au participant
router.get('/:id/join', requireAuth, joinLiveSession);

export default router;
