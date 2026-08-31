import express from 'express';
import {
  getPublishedPublications,
  getPublishedProjects
} from '../controllers/cms.controller.js';
import {
  createPublication,
  updatePublication,
  togglePublicationStatus,
  deletePublication,
  createProject,
  updateProject,
  toggleProjectVisibility,
  deleteProject,
  getQuotes,
  updateQuoteStatus,
  deleteQuote
} from '../controllers/admin.cms.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { restrictToRole } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createPublicationSchema, createProjectSchema } from '../validators/cms.validator.js';

const router = express.Router();

// ---- ROUTES PUBLIQUES (Pas de token nécessaire) ----
router.get('/publications', getPublishedPublications);
router.get('/projects', getPublishedProjects);

// ---- ROUTES ADMIN (Protégées par MANAGER) ----
router.use(requireAuth, restrictToRole('MANAGER'));

// Gestion Publications
router.post('/publications', validate({ body: createPublicationSchema }), createPublication);
router.put('/publications/:id', validate({ body: createPublicationSchema }), updatePublication);
router.patch('/publications/:id/toggle-publish', togglePublicationStatus);
router.delete('/publications/:id', deletePublication);

// Gestion Projets
router.post('/projects', validate({ body: createProjectSchema }), createProject);
router.put('/projects/:id', validate({ body: createProjectSchema }), updateProject);
router.patch('/projects/:id/toggle-publish', toggleProjectVisibility);
router.delete('/projects/:id', deleteProject);

// Gestion Devis (Quotes)
router.get('/quotes', getQuotes);
router.patch('/quotes/:id/status', updateQuoteStatus);
router.delete('/quotes/:id', deleteQuote);

export default router;
