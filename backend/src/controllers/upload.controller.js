import { uploadImage, uploadDocument } from '../middlewares/upload.middleware.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

/**
 * POST /api/upload/image — Upload d'une image
 */
export const handleImageUpload = (req, res) => {
  uploadImage(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier reçu.' });
    }

    const url = `/uploads/images/${req.file.filename}`;
    return res.status(201).json({
      message: 'Image uploadée avec succès.',
      url,
      filename: req.file.filename
    });
  });
};

/**
 * POST /api/upload/document — Upload d'un document PDF
 */
export const handleDocumentUpload = (req, res) => {
  uploadDocument(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier reçu.' });
    }

    const url = `/uploads/documents/${req.file.filename}`;
    return res.status(201).json({
      message: 'Document uploadé avec succès.',
      url,
      filename: req.file.filename
    });
  });
};
