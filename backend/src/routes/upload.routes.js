import { Router } from 'express';
import { handleImageUpload, handleDocumentUpload, handleVideoUpload } from '../controllers/upload.controller.js';
import { requireAuth, checkGlobalActivation } from '../middlewares/auth.middleware.js';
import { restrictToRole } from '../middlewares/role.middleware.js';

const router = Router();

// Toutes les routes upload nécessitent d'être connecté (compte actif)
router.use(requireAuth, checkGlobalActivation);

// POST /api/upload/image     — image (max 5 MB)   · tout utilisateur connecté
router.post('/image', handleImageUpload);

// POST /api/upload/document  — PDF / document (max 25 MB) · formateurs & admin
router.post('/document', restrictToRole('INSTRUCTOR', 'MANAGER'), handleDocumentUpload);

// POST /api/upload/video     — vidéo de cours (max 300 MB) · formateurs & admin
router.post('/video', restrictToRole('INSTRUCTOR', 'MANAGER'), handleVideoUpload);

export default router;
