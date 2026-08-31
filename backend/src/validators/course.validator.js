import { z } from 'zod';

const LEVELS = ['Débutant', 'Intermédiaire', 'Avancé'];

export const createCourseSchema = z.object({
  title: z.string().min(3, 'Le titre doit faire au moins 3 caractères.').max(255),
  description: z.string().min(10, 'La description doit faire au moins 10 caractères.'),
  price: z.number({ invalid_type_error: 'Le prix doit être un nombre.' }).positive('Le prix doit être positif.'),
  imageUrl: z.string().url('URL image invalide.').optional().or(z.literal('')),
  level: z.enum(LEVELS, { errorMap: () => ({ message: `Le niveau doit être parmi : ${LEVELS.join(', ')}` }) }).optional(),
  durationHours: z.number().int().nonnegative('La durée doit être positive.').optional(),
  // Nom de la classe principale créée avec la formation (optionnel — libellé par défaut sinon)
  classroomName: z.string().min(2).max(100).optional(),
}).strict();

export const updateCourseSchema = createCourseSchema.partial().extend({
  isPublished: z.boolean().optional(),
}).strict();
