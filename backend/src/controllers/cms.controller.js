import { z } from 'zod';
import prisma from '../config/prisma.js';

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
  imageUrl: z.string().url("Le lien de l'image est invalide").optional().or(z.literal(''))
});

// ---- PUBLIC ENDPOINTS ----
export const getPublishedPublications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.publication.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.publication.count({ where: { status: 'PUBLISHED' } })
    ]);

    return res.status(200).json({ data, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const getPublishedProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const statusFilter = ['ONGOING', 'COMPLETED'].includes(String(req.query.status).toUpperCase())
      ? String(req.query.status).toUpperCase()
      : undefined;
    const where = { isPublished: true, ...(statusFilter ? { status: statusFilter } : {}) };

    const [data, total] = await Promise.all([
      prisma.project.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.project.count({ where }),
    ]);

    return res.status(200).json({ data, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/** PUBLIC — Une publication publiée par son id. */
export const getPublicationById = async (req, res) => {
  try {
    const pub = await prisma.publication.findFirst({
      where: { id: req.params.id, status: 'PUBLISHED' },
    });
    if (!pub) return res.status(404).json({ message: 'Publication introuvable.' });
    return res.status(200).json(pub);
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/** PUBLIC — Un projet publié par son id. */
export const getProjectById = async (req, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, isPublished: true },
    });
    if (!project) return res.status(404).json({ message: 'Projet introuvable.' });
    return res.status(200).json(project);
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

export const getPublishedCourses = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const skip = (page - 1) * limit;

    const [total, courses] = await Promise.all([
      prisma.course.count({ where: { isPublished: true } }),
      prisma.course.findMany({
        where: { isPublished: true },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          imageUrl: true,
          level: true,
          durationHours: true,
          isPublished: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    ]);

    return res.status(200).json({ data: courses, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("[COURSE] Erreur récupération cours :", error);
    return res.status(500).json({ message: "Erreur serveur lors de la récupération des cours." });
  }
};
