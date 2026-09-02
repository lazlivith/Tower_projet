import express from 'express';
import {
  getPublishedPublications,
  getPublishedProjects,
  getPublicationById,
  getProjectById,
} from '../controllers/cms.controller.js';
import {
  createPublication,
  updatePublication,
  togglePublicationStatus,
  deletePublication,
  getAllPublications,
  createProject,
  updateProject,
  toggleProjectVisibility,
  deleteProject,
  getAllProjects,
  getQuotes,
  updateQuoteStatus,
  deleteQuote,
  getPublishedServices,
  getServiceBySlug,
  getAllServices,
  createService,
  updateService,
  toggleServiceVisibility,
  reorderServices,
  deleteService,
} from '../controllers/admin.cms.controller.js';
import { requireAuth, checkGlobalActivation } from '../middlewares/auth.middleware.js';
import { restrictToRole } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createPublicationSchema, createProjectSchema, createServiceSchema } from '../validators/cms.validator.js';

const router = express.Router();

// ---- ROUTES PUBLIQUES ----
router.get('/publications', getPublishedPublications);
router.get('/publications/:id', getPublicationById);
router.get('/projects', getPublishedProjects); // ?status=ONGOING|COMPLETED
router.get('/projects/:id', getProjectById);
router.get('/services', getPublishedServices); // { services: [...], amo: {...}|null }
router.get('/services/:slug', getServiceBySlug);

// ---- ROUTES ADMIN (MANAGER) ----
router.use(requireAuth, checkGlobalActivation, restrictToRole('MANAGER'));

// Vue back-office : tout le contenu, brouillons/non-publiés inclus
router.get('/admin/publications', getAllPublications);
router.get('/admin/projects', getAllProjects);
router.get('/admin/services', getAllServices);

// Publications
router.post('/publications', validate({ body: createPublicationSchema }), createPublication);
router.put('/publications/:id', validate({ body: createPublicationSchema }), updatePublication);
router.patch('/publications/:id/toggle-publish', togglePublicationStatus);
router.delete('/publications/:id', deletePublication);

// Projets
router.post('/projects', validate({ body: createProjectSchema }), createProject);
router.put('/projects/:id', validate({ body: createProjectSchema }), updateProject);
router.patch('/projects/:id/toggle-publish', toggleProjectVisibility);
router.delete('/projects/:id', deleteProject);

// Services vitrine
router.post('/services', validate({ body: createServiceSchema }), createService);
router.patch('/services/reorder', reorderServices); // avant /:id
router.put('/services/:id', validate({ body: createServiceSchema }), updateService);
router.patch('/services/:id/toggle-publish', toggleServiceVisibility);
router.delete('/services/:id', deleteService);

// Devis
router.get('/quotes', getQuotes);
router.patch('/quotes/:id/status', updateQuoteStatus);
router.delete('/quotes/:id', deleteQuote);

export default router;
