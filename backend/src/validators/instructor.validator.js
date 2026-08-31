import { z } from 'zod';

export const createClassroomSchema = z.object({
  courseId: z.string().uuid('Le courseId doit être un UUID valide.'),
  name: z.string().min(3, 'Le nom de la classe doit faire au moins 3 caractères.')
}).strict();

export const addLessonSchema = z.object({
  courseId: z.string().uuid('Le courseId doit être un UUID valide.'),
  title: z.string().min(3, 'Le titre doit faire au moins 3 caractères.'),
  videoUrl: z.string().url('URL vidéo invalide.').optional().or(z.literal('')),
  documentUrl: z.string().url('URL document invalide.').optional().or(z.literal('')),
  sequenceOrder: z.number().int().positive().optional()
}).strict();

export const moveStudentSchema = z.object({
  enrollmentId: z.string().uuid('L\'enrollmentId doit être un UUID valide.'),
  newClassroomId: z.string().uuid('Le newClassroomId doit être un UUID valide.')
}).strict();

export const onboardInstructorSchema = z.object({
  nom: z.string().min(2, 'Le nom est requis (2 caractères minimum).').max(100),
  email: z.string().email('Email invalide.'),
  courseId: z.string().uuid('Le courseId doit être un UUID valide.'),
  classroomId: z.string().uuid('Le classroomId doit être un UUID valide.').optional()
}).strict();
