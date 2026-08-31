import { z } from 'zod';

/** Normalise une chaîne de statut (accepte "draft"/"DRAFT"/etc.). */
const upper = (v) => (typeof v === 'string' ? v.toUpperCase() : v);
const optionalUrl = z.string().url('URL image invalide.').optional().or(z.literal('')).or(z.null());
const optionalText = (max) => z.string().max(max).optional().or(z.literal('')).or(z.null());

export const createPublicationSchema = z.object({
  title: z.string().min(3, 'Le titre doit faire au moins 3 caractères.').max(255),
  content: z.string().min(10, 'Le contenu doit faire au moins 10 caractères.'),
  excerpt: optionalText(500),
  category: optionalText(100),
  imageUrl: optionalUrl,
  status: z.preprocess(upper, z.enum(['DRAFT', 'PUBLISHED'])).optional(),
}).strip(); // ignore les champs inconnus (slug, etc.) au lieu de rejeter

export const createProjectSchema = z.object({
  title: z.string().min(3, 'Le titre doit faire au moins 3 caractères.').max(255),
  description: z.string().min(10, 'La description doit faire au moins 10 caractères.'),
  category: z.string().min(2, 'La catégorie est requise.').max(100), // texte libre
  imageUrl: optionalUrl,
  status: z.preprocess(upper, z.enum(['ONGOING', 'COMPLETED'])).optional(),
  isPublished: z.boolean().optional(),
}).strip();
