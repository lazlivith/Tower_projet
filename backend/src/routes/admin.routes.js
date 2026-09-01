import express from 'express';
import { getUsers, toggleUserStatus, toggleEnrollmentStatus, enrollStudentInClass, validateCertificate, onboardInstructor, assignInstructorToCourse, getPendingEnrollments, validateEnrollmentAccess } from '../controllers/admin.controller.js';
import { createCourse, updateCourse } from '../controllers/admin.cms.controller.js';
import {
  getOverview,
  getCourses as getAcademyCourses,
  getCourseContent,
  getInstructors,
  createInstructor,
  createClassroom,
  updateClassroom,
  deleteClassroom,
} from '../controllers/admin.academy.controller.js';
import { requireAuth, checkGlobalActivation } from '../middlewares/auth.middleware.js';
import { restrictToRole } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { updateCourseSchema, createCourseSchema } from '../validators/course.validator.js';
import { onboardInstructorSchema } from '../validators/instructor.validator.js';
import {
  createInstructorSchema,
  createClassroomSchema,
  updateClassroomSchema,
} from '../validators/academy.validator.js';

const router = express.Router();

// Toutes les routes ci-dessous nécessitent d'être connecté, d'avoir un compte actif et d'être Superadmin (MANAGER)
router.use(requireAuth, checkGlobalActivation, restrictToRole('MANAGER'));

// Back-office : Liste de tous les utilisateurs
/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Récupérer la liste des utilisateurs (Manager)
 *     tags: [Admin]
 */
router.get('/users', getUsers);

// Back-office : Bloquer / Débloquer un utilisateur
router.patch('/users/:userId/toggle-status', toggleUserStatus);

// Back-office : Bloquer / Débloquer l'accès à une formation pour un élève
router.patch('/enrollments/:enrollmentId/status', toggleEnrollmentStatus);

// Back-office : Assigner un élève dans sa classe suite à son paiement
router.post('/enrollments/assign', enrollStudentInClass);

// Back-office : Créer une formation et une classe simultanément
router.post('/courses', validate({ body: createCourseSchema }), createCourse);

// Back-office : Valider la fin de formation et générer le certificat
router.post('/certificates/validate', validateCertificate);

// Back-office : Modifier une formation existante
router.put('/courses/:courseId', validate({ body: updateCourseSchema }), updateCourse);

// ──── NOUVEAUX ENDPOINTS ────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/instructors/onboard:
 *   post:
 *     summary: Créer et assigner un instructeur (Transaction)
 *     tags: [Admin]
 */
router.post('/instructors/onboard', validate({ body: onboardInstructorSchema }), onboardInstructor);

// Assigner un instructeur à une formation
router.patch('/courses/:courseId/assign-instructor', assignInstructorToCourse);

// Voir les inscriptions en attente de validation de paiement
router.get('/enrollments/pending', getPendingEnrollments);

// Valider manuellement l'accès d'un étudiant (paiement simulé)
router.patch('/enrollments/:enrollmentId/validate-access', validateEnrollmentAccess);

// ──── ACADÉMIE & SUIVI GLOBAL ───────────────────────────────────────

// Suivi global de la plateforme (compteurs, entonnoir, activité récente)
router.get('/overview', getOverview);

// Formations back-office : liste (classes + instructeurs + contenu) et détail
router.get('/academy/courses', getAcademyCourses);
router.get('/academy/courses/:courseId/content', getCourseContent);

// Instructeurs : liste + création simple (assignation optionnelle)
router.get('/instructors', getInstructors);
router.post('/instructors', validate({ body: createInstructorSchema }), createInstructor);

// Classes en ligne (une formation = plusieurs classes, un formateur par classe)
router.post('/classrooms', validate({ body: createClassroomSchema }), createClassroom);
router.patch('/classrooms/:classroomId', validate({ body: updateClassroomSchema }), updateClassroom);
router.delete('/classrooms/:classroomId', deleteClassroom);

export default router;

