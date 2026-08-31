import express from 'express';
import { getNotifications, markNotificationRead, markAllRead } from '../controllers/notification.controller.js';
import { requireAuth, checkGlobalActivation } from '../middlewares/auth.middleware.js';

const router = express.Router();
router.use(requireAuth, checkGlobalActivation);

router.get('/', getNotifications);
router.patch('/mark-all-read', markAllRead);
router.patch('/:id/read', markNotificationRead);

export default router;
