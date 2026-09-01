import { z } from 'zod';

/**
 * Validation des endpoints « Académie » du back-office (MANAGER) :
 * création d'instructeur, gestion des classes en ligne (classrooms).
 */

// Création d'un instructeur — l'assignation à un cours / une classe est optionnelle
export const createInstructorSchema = z.object({
  nom: z.string().min(2, 'Le nom est requis (2 caractères minimum).').max(100),
  email: z.string().email('Email invalide.'),
  courseId: z.string().uuid('Le courseId doit être un UUID valide.').optional().or(z.literal('')),
  classroomId: z.string().uuid('Le classroomId doit être un UUID valide.').optional().or(z.literal('')),
}).strip();

// Création d'une classe en ligne rattachée à une formation
export const createClassroomSchema = z.object({
  courseId: z.string().uuid('Le courseId doit être un UUID valide.'),
  name: z.string().min(2, 'Le nom de la classe doit faire au moins 2 caractères.').max(100),
  instructorId: z.string().uuid('Le instructorId doit être un UUID valide.').optional().or(z.literal('')).or(z.null()),
}).strip();

// Mise à jour d'une classe : renommage et/ou (dé)assignation d'un formateur (null = désassigner)
export const updateClassroomSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  instructorId: z.string().uuid('Le instructorId doit être un UUID valide.').nullable().optional().or(z.literal('')),
}).strip();
