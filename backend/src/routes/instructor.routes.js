import express from 'express';
import { createClassroom, moveStudent, getMyInstructorCourses, getMyClassrooms, addLessonToCourse, getClassroomStudents, createLiveSession } from '../controllers/instructor.controller.js';
import { uploadQuiz, listClassroomQuizzes, deleteQuiz } from '../controllers/quiz.controller.js';
import { requireAuth, checkGlobalActivation } from '../middlewares/auth.middleware.js';
import { restrictToRole } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { uploadSpreadsheet } from '../middlewares/upload.middleware.js';
import { createClassroomSchema, addLessonSchema, moveStudentSchema } from '../validators/instructor.validator.js';

const router = express.Router();

router.use(requireAuth, checkGlobalActivation, restrictToRole('INSTRUCTOR', 'MANAGER'));

router.get('/my-courses', getMyInstructorCourses);
router.get('/classrooms', getMyClassrooms);
router.post('/classrooms', validate({ body: createClassroomSchema }), createClassroom);
router.post('/lessons', validate({ body: addLessonSchema }), addLessonToCourse);
router.patch('/move-student', validate({ body: moveStudentSchema }), moveStudent);

router.get('/courses/:courseId/students', getClassroomStudents);
router.post('/courses/:courseId/sessions', createLiveSession);

// ─── Quiz (import Excel) ───────────────────────────────────────────
router.post('/quizzes/upload', uploadSpreadsheet, uploadQuiz);
router.get('/classrooms/:classroomId/quizzes', listClassroomQuizzes);
router.delete('/quizzes/:id', deleteQuiz);

export default router;
