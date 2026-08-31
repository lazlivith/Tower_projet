import { z } from 'zod';

export const registerSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères.').max(100),
  email: z.string().email('Adresse email invalide.').max(150),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.').max(255),
}).strict();

export const loginSchema = z.object({
  email: z.string().email('Adresse email invalide.'),
  password: z.string().min(1, 'Le mot de passe est obligatoire.'),
}).strict();

export const forgotPasswordSchema = z.object({
  email: z.string().email('Adresse email invalide.'),
}).strict();

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requis.'),
  password: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères.'),
}).strict();
