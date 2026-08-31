import express from 'express';
import { getInbox, sendMessage, markAsRead } from '../controllers/messaging.controller.js';
import { requireAuth, checkGlobalActivation } from '../middlewares/auth.middleware.js';

const router = express.Router();
router.use(requireAuth, checkGlobalActivation);

router.get('/', getInbox);
router.post('/send', sendMessage);
router.patch('/:messageId/read', markAsRead);

export default router;
