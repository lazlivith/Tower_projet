import prisma from '../config/prisma.js';

// ---- Fonction Utilitaire Cache (Simulé) ----
const invalidatePublicCache = (model, action) => {
  console.log(`[CACHE] ${model} / ${action} — les requêtes publiques renverront les données fraîches.`);
};

// Le corps est déjà validé et nettoyé (.strip) par validate({ body }) au niveau route.
const clean = (v) => (v === '' ? null : v);
const QUOTE_STATUSES = ['PENDING', 'ACCEPTED', 'CONTACTED', 'REJECTED'];

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
    const { title, content, excerpt, category, imageUrl, status } = req.body;
    const publication = await prisma.publication.create({
      data: {
        title,
        content,
        excerpt: clean(excerpt),
        category: clean(category),
        imageUrl: clean(imageUrl),
        status: status || 'DRAFT',
      },
    });
    invalidatePublicCache('Publication', 'CREATE');
    return res.status(201).json({ message: 'Publication créée', publication });
  } catch (error) {
    console.error('[CMS] createPublication:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

export const updatePublication = async (req, res) => {
  try {
    const { title, content, excerpt, category, imageUrl, status } = req.body;
    const publication = await prisma.publication.update({
      where: { id: req.params.id },
      data: {
        title,
        content,
        excerpt: clean(excerpt),
        category: clean(category),
        imageUrl: clean(imageUrl),
        ...(status ? { status } : {}),
      },
    });
    invalidatePublicCache('Publication', 'UPDATE');
    return res.status(200).json({ message: 'Publication mise à jour', publication });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Publication introuvable.' });
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/** ADMIN — Toutes les publications (brouillons inclus). */
export const getAllPublications = async (req, res) => {
  try {
    const publications = await prisma.publication.findMany({ orderBy: { createdAt: 'desc' } });
    return res.status(200).json(publications);
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
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
    const { title, description, category, imageUrl, status, isPublished } = req.body;
    const project = await prisma.project.create({
      data: {
        title,
        description,
        category,
        imageUrl: clean(imageUrl),
        status: status || 'COMPLETED',
        isPublished: isPublished ?? false,
      },
    });
    invalidatePublicCache('Project', 'CREATE');
    return res.status(201).json({ message: 'Projet créé', project });
  } catch (error) {
    console.error('[CMS] createProject:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { title, description, category, imageUrl, status, isPublished } = req.body;
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        category,
        imageUrl: clean(imageUrl),
        ...(status ? { status } : {}),
        ...(isPublished !== undefined ? { isPublished } : {}),
      },
    });
    invalidatePublicCache('Project', 'UPDATE');
    return res.status(200).json({ message: 'Projet mis à jour', project });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Projet introuvable.' });
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/** ADMIN — Tous les projets (non publiés inclus). */
export const getAllProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({ orderBy: { createdAt: 'desc' } });
    return res.status(200).json(projects);
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
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
    const status = String(req.body?.status || '').toUpperCase();
    if (!QUOTE_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Statut invalide (${QUOTE_STATUSES.join(', ')}).` });
    }
    const quote = await prisma.quote.update({ where: { id: req.params.id }, data: { status } });
    invalidatePublicCache('Quote', 'UPDATE_STATUS');
    return res.status(200).json({ message: 'Statut du devis mis à jour', quote });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Devis introuvable.' });
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
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
