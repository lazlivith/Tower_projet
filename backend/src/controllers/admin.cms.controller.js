import { z } from 'zod';
import prisma from '../config/prisma.js';

// ---- Fonction Utilitaire Cache (Simulé) ----
const invalidatePublicCache = (model, action) => {
  // Dans un vrai système, on pourrait vider Redis ou purger un CDN
  console.log(`[CACHE INVALIDATION] Données rafraîchies pour le modèle ${model} suite à l'action ${action}. Les requêtes publiques renverront les données les plus fraîches.`);
};

// ---- Zod Schemas ----
export const publicationSchema = z.object({
  title: z.string().min(3, "Le titre doit faire au moins 3 caractères"),
  content: z.string().min(10, "Le contenu ne peut pas être vide"),
  imageUrl: z.string().url("Le lien de l'image est invalide").optional().or(z.literal('')),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT')
});

export const projectSchema = z.object({
  title: z.string().min(3, "Le titre doit faire au moins 3 caractères"),
  description: z.string().min(10, "La description ne peut pas être vide"),
  category: z.string().min(2, "La catégorie est requise"),
  imageUrl: z.string().url("Le lien de l'image est invalide").optional().or(z.literal('')),
  isPublished: z.boolean().default(false)
});

export const quoteSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'CONTACTED', 'REJECTED'])
});

// ==========================================
// COURSES (FORMATIONS) — création / mise à jour back-office
// ==========================================

/**
 * MANAGER — Créer une formation ET sa classe principale en une transaction.
 * Le corps est validé en amont par `createCourseSchema` (course.validator.js).
 */
export const createCourse = async (req, res) => {
  try {
    const { title, description, price, imageUrl, level, durationHours, classroomName } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const course = await tx.course.create({
        data: {
          title,
          description,
          price,
          imageUrl: imageUrl || null,
          level: level || undefined,
          durationHours: durationHours ?? undefined,
        },
      });

      const classroom = await tx.classroom.create({
        data: { name: classroomName?.trim() || `Classe principale - ${title}`, courseId: course.id },
      });

      return { course, classroom };
    });

    invalidatePublicCache('Course', 'CREATE');
    return res.status(201).json({ message: 'Formation et classe créées.', ...result });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la création de la formation.', error: error.message });
  }
};

/**
 * MANAGER — Mettre à jour une formation existante.
 * Le corps est validé en amont par `updateCourseSchema` (champs partiels + isPublished).
 */
export const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    // classroomName ne concerne que la création — on l'ignore ici
    const { classroomName, ...data } = req.body;

    const course = await prisma.course.update({
      where: { id: courseId },
      data,
    });

    invalidatePublicCache('Course', 'UPDATE');
    return res.status(200).json({ message: 'Formation mise à jour.', course });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Formation introuvable.' });
    return res.status(500).json({ message: 'Erreur lors de la mise à jour de la formation.', error: error.message });
  }
};

// ==========================================
// PUBLICATIONS CRUD
// ==========================================
export const createPublication = async (req, res) => {
  try {
    const parsedData = publicationSchema.parse(req.body);
    const publication = await prisma.$transaction(async (tx) => {
      return await tx.publication.create({ data: parsedData });
    });
    invalidatePublicCache('Publication', 'CREATE');
    return res.status(201).json({ message: "Publication créée", publication });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const updatePublication = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedData = publicationSchema.parse(req.body);
    const publication = await prisma.publication.update({
      where: { id },
      data: parsedData
    });
    invalidatePublicCache('Publication', 'UPDATE');
    return res.status(200).json({ message: "Publication mise à jour", publication });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const togglePublicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const current = await prisma.publication.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ message: "Publication introuvable" });
    
    const newStatus = current.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    const updated = await prisma.publication.update({
      where: { id },
      data: { status: newStatus }
    });
    invalidatePublicCache('Publication', 'TOGGLE_VISIBILITY');
    return res.status(200).json({ message: `Publication ${newStatus}`, publication: updated });
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const deletePublication = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.publication.delete({ where: { id } });
    invalidatePublicCache('Publication', 'DELETE');
    return res.status(200).json({ message: "Publication supprimée" });
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ==========================================
// PROJECTS CRUD
// ==========================================
export const createProject = async (req, res) => {
  try {
    const parsedData = projectSchema.parse(req.body);
    const project = await prisma.$transaction(async (tx) => {
      return await tx.project.create({ data: parsedData });
    });
    invalidatePublicCache('Project', 'CREATE');
    return res.status(201).json({ message: "Projet créé", project });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedData = projectSchema.parse(req.body);
    const project = await prisma.project.update({
      where: { id },
      data: parsedData
    });
    invalidatePublicCache('Project', 'UPDATE');
    return res.status(200).json({ message: "Projet mis à jour", project });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const toggleProjectVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const current = await prisma.project.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ message: "Projet introuvable" });
    
    const updated = await prisma.project.update({
      where: { id },
      data: { isPublished: !current.isPublished }
    });
    invalidatePublicCache('Project', 'TOGGLE_VISIBILITY');
    const stateStr = updated.isPublished ? 'publié' : 'masqué';
    return res.status(200).json({ message: `Projet ${stateStr} avec succès`, project: updated });
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.project.delete({ where: { id } });
    invalidatePublicCache('Project', 'DELETE');
    return res.status(200).json({ message: "Projet supprimé" });
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ==========================================
// QUOTES (DEVIS) CRUD
// ==========================================
export const getQuotes = async (req, res) => {
  try {
    const quotes = await prisma.quote.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(quotes);
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const updateQuoteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedData = quoteSchema.parse(req.body);
    const quote = await prisma.quote.update({
      where: { id },
      data: { status: parsedData.status }
    });
    invalidatePublicCache('Quote', 'UPDATE_STATUS');
    return res.status(200).json({ message: "Statut du devis mis à jour", quote });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const deleteQuote = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.quote.delete({ where: { id } });
    invalidatePublicCache('Quote', 'DELETE');
    return res.status(200).json({ message: "Devis supprimé" });
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
