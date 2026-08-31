import { z } from 'zod';

export const createQuoteSchema = z.object({
  clientName: z.string().min(2, 'Le nom doit faire au moins 2 caractères.').max(150),
  email: z.string().email('Adresse email invalide.').max(150),
  serviceType: z.string().min(2, 'Le type de service est requis.').max(100),
  description: z.string().min(20, 'La description doit faire au moins 20 caractères.').max(5000),
}).strict();

export const updateQuoteStatusSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'CONTACTED', 'REJECTED'], {
    errorMap: () => ({ message: 'Statut invalide (PENDING, ACCEPTED, CONTACTED, REJECTED).' })
  }),
}).strict();
