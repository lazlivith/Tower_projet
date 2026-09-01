import express from 'express';
import {
  createClassroom, moveStudent, getMyInstructorCourses, getMyClassrooms,
  addLessonToCourse, getClassroomStudents, createLiveSession,
  getInstructorOverview, listCourseLessons, updateLesson, deleteLesson, reorderLessons,
  listMySessions, updateSession, deleteSession,
} from '../controllers/instructor.controller.js';
import {
  uploadQuiz, createQuiz, listClassroomQuizzes, getQuizResults, deleteQuiz, downloadQuizTemplate,
} from '../controllers/quiz.controller.js';
import { requireAuth, checkGlobalActivation } from '../middlewares/auth.middleware.js';
import { restrictToRole } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { uploadSpreadsheet } from '../middlewares/upload.middleware.js';
import { createClassroomSchema, addLessonSchema, moveStudentSchema } from '../validators/instructor.validator.js';

const router = express.Router();

router.use(requireAuth, checkGlobalActivation, restrictToRole('INSTRUCTOR', 'MANAGER'));

// Synthèse de l'espace
router.get('/overview', getInstructorOverview);

router.get('/my-courses', getMyInstructorCourses);
router.get('/classrooms', getMyClassrooms);
router.post('/classrooms', validate({ body: createClassroomSchema }), createClassroom);
router.patch('/move-student', validate({ body: moveStudentSchema }), moveStudent);

router.get('/courses/:courseId/students', getClassroomStudents);

// ─── Contenu des cours : leçons (vidéo YouTube / upload, PDF) ──────
router.get('/courses/:courseId/lessons', listCourseLessons);
router.post('/lessons', validate({ body: addLessonSchema }), addLessonToCourse);
router.patch('/lessons/:lessonId', updateLesson);
router.delete('/lessons/:lessonId', deleteLesson);
router.patch('/courses/:courseId/lessons/reorder', reorderLessons);

// ─── Sessions (calendrier) ───────────────────────────────────────
router.get('/sessions', listMySessions);
router.post('/courses/:courseId/sessions', createLiveSession);
router.patch('/sessions/:sessionId', updateSession);
router.delete('/sessions/:sessionId', deleteSession);

// ─── Quiz : classe entière OU élève précis ──────────────────────
router.get('/quizzes/template.xlsx', downloadQuizTemplate);
router.post('/quizzes/upload', uploadSpreadsheet, uploadQuiz);          // fichier (.xlsx/.csv)
router.post('/classrooms/:classroomId/quizzes', createQuiz);            // depuis le QuizBuilder (JSON)
router.get('/classrooms/:classroomId/quizzes', listClassroomQuizzes);
router.get('/quizzes/:id/results', getQuizResults);
router.delete('/quizzes/:id', deleteQuiz);

export default router;
