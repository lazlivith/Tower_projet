import { Router } from 'express';
import { requireAuth, checkGlobalActivation } from '../middlewares/auth.middleware.js';
import {
  getMyClassrooms,
  listMessages,
  postMessage,
  deleteMessage,
} from '../controllers/classroom.controller.js';

const router = Router();

// Accessible à tout compte actif ; le contrôle fin (instructeur de la classe /
// élève inscrit actif) est fait dans le contrôleur via resolveClassroomAccess.
router.use(requireAuth, checkGlobalActivation);

router.get('/mine', getMyClassrooms);
router.get('/:classroomId/messages', listMessages);
router.post('/:classroomId/messages', postMessage);
router.delete('/:classroomId/messages/:messageId', deleteMessage);

export default router;
