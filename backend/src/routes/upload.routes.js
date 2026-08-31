import { Router } from 'express';
import { handleImageUpload, handleDocumentUpload } from '../controllers/upload.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Toutes les routes upload nécessitent d'être connecté
router.use(requireAuth);

// POST /api/upload/image — Upload d'une image (max 5 MB)
router.post('/image', handleImageUpload);

// POST /api/upload/document — Upload d'un document PDF (max 20 MB)
router.post('/document', handleDocumentUpload);

export default router;
