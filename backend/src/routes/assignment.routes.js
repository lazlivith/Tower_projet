import express from 'express';
import { getPendingSubmissions, gradeSubmission, submitAssignment } from '../controllers/assignment.controller.js';
import { requireAuth, checkGlobalActivation } from '../middlewares/auth.middleware.js';
import { restrictToRole } from '../middlewares/role.middleware.js';

const router = express.Router();
router.use(requireAuth, checkGlobalActivation);

router.get('/pending', restrictToRole('INSTRUCTOR', 'MANAGER'), getPendingSubmissions);
router.patch('/:submissionId/grade', restrictToRole('INSTRUCTOR', 'MANAGER'), gradeSubmission);
router.post('/submit', restrictToRole('STUDENT'), submitAssignment);

export default router;
