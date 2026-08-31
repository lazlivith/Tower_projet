import express from 'express';
import { getAdminStats, getInstructorStats, getStudentStats } from '../controllers/stats.controller.js';
import { requireAuth, checkGlobalActivation } from '../middlewares/auth.middleware.js';
import { restrictToRole } from '../middlewares/role.middleware.js';

const router = express.Router();
router.use(requireAuth, checkGlobalActivation);

router.get('/admin', restrictToRole('MANAGER'), getAdminStats);
router.get('/instructor', restrictToRole('INSTRUCTOR', 'MANAGER'), getInstructorStats);
router.get('/student', restrictToRole('STUDENT'), getStudentStats);

export default router;
