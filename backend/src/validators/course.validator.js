import { z } from 'zod';

const LEVELS = ['Débutant', 'Intermédiaire', 'Avancé'];

const optText = z.string().optional().or(z.literal('')).or(z.null());

export const createCourseSchema = z.object({
  title: z.string().min(3, 'Le titre doit faire au moins 3 caractères.').max(255),
  description: z.string().min(10, 'La description doit faire au moins 10 caractères.'),
  price: z.number({ invalid_type_error: 'Le prix doit être un nombre.' }).positive('Le prix doit être positif.'),
  imageUrl: z.string().url('URL image invalide.').optional().or(z.literal('')),
  level: z.enum(LEVELS, { errorMap: () => ({ message: `Le niveau doit être parmi : ${LEVELS.join(', ')}` }) }).optional(),
  durationHours: z.number().int().nonnegative('La durée doit être positive.').optional(),
  classroomName: z.string().min(2).max(100).optional(),

  // --- Fiche pédagogique vitrine (optionnel) ---
  audience: optText,
  prerequisites: optText,
  format: z.string().max(255).optional().or(z.literal('')).or(z.null()),
  priceLabel: z.string().max(120).optional().or(z.literal('')).or(z.null()),
  objectives: z.array(z.string().min(1)).optional().or(z.null()),
  syllabus: z.array(z.object({
    label: z.string().optional().or(z.literal('')),
    title: z.string().min(1),
    points: z.array(z.string()).optional(),
  })).optional().or(z.null()),
}).strip();

export const updateCourseSchema = createCourseSchema.partial().extend({
  isPublished: z.boolean().optional(),
}).strip();
