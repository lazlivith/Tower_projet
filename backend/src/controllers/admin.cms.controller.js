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
    const {
      title, description, price, imageUrl, level, durationHours, classroomName,
      audience, prerequisites, format, priceLabel, objectives, syllabus,
    } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const course = await tx.course.create({
        data: {
          title,
          description,
          price,
          imageUrl: imageUrl || null,
          level: level || undefined,
          durationHours: durationHours ?? undefined,
          audience: clean(audience),
          prerequisites: clean(prerequisites),
          format: clean(format),
          priceLabel: clean(priceLabel),
          objectives: objectives?.length ? objectives : undefined,
          syllabus: syllabus?.length ? syllabus : undefined,
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
    const { title, description, category, imageUrl, status, isPublished, location, surface, missions, challenge, solution } = req.body;
    const project = await prisma.project.create({
      data: {
        title,
        description,
        category,
        imageUrl: clean(imageUrl),
        status: status || 'COMPLETED',
        isPublished: isPublished ?? false,
        location: clean(location),
        surface: clean(surface),
        missions: clean(missions),
        challenge: clean(challenge),
        solution: clean(solution),
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
    const { title, description, category, imageUrl, status, isPublished, location, surface, missions, challenge, solution } = req.body;
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        category,
        imageUrl: clean(imageUrl),
        ...(status ? { status } : {}),
        ...(isPublished !== undefined ? { isPublished } : {}),
        location: clean(location),
        surface: clean(surface),
        missions: clean(missions),
        challenge: clean(challenge),
        solution: clean(solution),
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

// ==========================================
// SERVICES (vitrine) CRUD
// ==========================================
const slugify = (v) =>
  String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

const cleanService = (s) => ({
  id: s.id,
  slug: s.slug,
  kind: s.kind,
  title: s.title,
  summary: s.summary,
  imageUrl: s.imageUrl,
  objective: s.objective,
  scope: Array.isArray(s.scope) ? s.scope : [],
  deliverables: Array.isArray(s.deliverables) ? s.deliverables : [],
  order: s.order,
  isPublished: s.isPublished,
});

/** PUBLIC — services publiés : { services: [SERVICE], amo: AMO|null }. */
export const getPublishedServices = async (req, res) => {
  try {
    const rows = await prisma.service.findMany({
      where: { isPublished: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    const all = rows.map(cleanService);
    return res.status(200).json({
      services: all.filter((s) => s.kind === 'SERVICE'),
      amo: all.find((s) => s.kind === 'AMO') || null,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/** PUBLIC — un service publié par son slug. */
export const getServiceBySlug = async (req, res) => {
  try {
    const s = await prisma.service.findFirst({ where: { slug: req.params.slug, isPublished: true } });
    if (!s) return res.status(404).json({ message: 'Service introuvable.' });
    return res.status(200).json(cleanService(s));
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/** ADMIN — tous les services (non publiés inclus). */
export const getAllServices = async (req, res) => {
  try {
    const rows = await prisma.service.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] });
    return res.status(200).json(rows.map(cleanService));
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

export const createService = async (req, res) => {
  try {
    const { title, summary, kind, imageUrl, objective, scope, deliverables, order, isPublished } = req.body;
    let slug = req.body.slug || slugify(title);
    // slug unique
    if (await prisma.service.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

    const last = await prisma.service.aggregate({ _max: { order: true } });
    const service = await prisma.service.create({
      data: {
        slug,
        kind: kind || 'SERVICE',
        title,
        summary,
        imageUrl: clean(imageUrl),
        objective: clean(objective),
        scope: scope?.length ? scope : undefined,
        deliverables: deliverables?.length ? deliverables : undefined,
        order: Number.isInteger(order) ? order : (last._max.order ?? 0) + 1,
        isPublished: isPublished ?? true,
      },
    });
    invalidatePublicCache('Service', 'CREATE');
    return res.status(201).json({ message: 'Service créé', service: cleanService(service) });
  } catch (error) {
    console.error('[CMS] createService:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

export const updateService = async (req, res) => {
  try {
    const { title, summary, kind, imageUrl, objective, scope, deliverables, order, isPublished } = req.body;
    const data = {
      title, summary,
      imageUrl: clean(imageUrl),
      objective: clean(objective),
      scope: Array.isArray(scope) ? scope : undefined,
      deliverables: Array.isArray(deliverables) ? deliverables : undefined,
      ...(kind ? { kind } : {}),
      ...(Number.isInteger(order) ? { order } : {}),
      ...(isPublished !== undefined ? { isPublished } : {}),
    };
    if (req.body.slug) data.slug = slugify(req.body.slug);
    const service = await prisma.service.update({ where: { id: req.params.id }, data });
    invalidatePublicCache('Service', 'UPDATE');
    return res.status(200).json({ message: 'Service mis à jour', service: cleanService(service) });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Service introuvable.' });
    if (error.code === 'P2002') return res.status(400).json({ message: 'Ce slug est déjà utilisé.' });
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

export const toggleServiceVisibility = async (req, res) => {
  try {
    const cur = await prisma.service.findUnique({ where: { id: req.params.id } });
    if (!cur) return res.status(404).json({ message: 'Service introuvable.' });
    const service = await prisma.service.update({ where: { id: cur.id }, data: { isPublished: !cur.isPublished } });
    invalidatePublicCache('Service', 'TOGGLE_VISIBILITY');
    return res.status(200).json({ message: service.isPublished ? 'Service publié' : 'Service masqué', service: cleanService(service) });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

export const reorderServices = async (req, res) => {
  try {
    const ids = req.body?.ids;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ message: 'ids (tableau) requis.' });
    const known = new Set((await prisma.service.findMany({ select: { id: true } })).map((s) => s.id));
    if (!ids.every((id) => known.has(id))) return res.status(400).json({ message: 'Identifiant de service invalide.' });
    await prisma.$transaction(ids.map((id, i) => prisma.service.update({ where: { id }, data: { order: i + 1 } })));
    invalidatePublicCache('Service', 'REORDER');
    return res.status(200).json({ message: 'Ordre mis à jour.' });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

export const deleteService = async (req, res) => {
  try {
    await prisma.service.delete({ where: { id: req.params.id } });
    invalidatePublicCache('Service', 'DELETE');
    return res.status(200).json({ message: 'Service supprimé' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Service introuvable.' });
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};
