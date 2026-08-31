import { z } from 'zod';

const PUBLICATION_STATUS = ['DRAFT', 'PUBLISHED'];
const PROJECT_CATEGORIES = ['RESIDENTIAL', 'COMMERCIAL', 'INFRASTRUCTURE'];

export const createPublicationSchema = z.object({
  title: z.string().min(3, 'Le titre doit faire au moins 3 caractères.'),
  content: z.string().min(10, 'Le contenu doit faire au moins 10 caractères.'),
  imageUrl: z.string().url('URL image invalide.').optional(),
  status: z.enum(PUBLICATION_STATUS, { errorMap: () => ({ message: `Le statut doit être : ${PUBLICATION_STATUS.join(' ou ')}` }) }).optional()
}).strict();

export const createProjectSchema = z.object({
  title: z.string().min(3, 'Le titre doit faire au moins 3 caractères.'),
  description: z.string().min(10, 'La description doit faire au moins 10 caractères.'),
  imageUrl: z.string().url('URL image invalide.').optional(),
  category: z.enum(PROJECT_CATEGORIES, { errorMap: () => ({ message: `La catégorie doit être : ${PROJECT_CATEGORIES.join(', ')}` }) })
}).strict();
