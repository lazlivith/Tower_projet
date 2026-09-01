import { uploadImage, uploadDocument, uploadVideo } from '../middlewares/upload.middleware.js';
import { storeFile, storageProvider } from '../services/storage.service.js';

/** Wrappe un middleware multer `.single('file')` en promesse. */
const runMulter = (mw, req, res) =>
  new Promise((resolve, reject) => {
    mw(req, res, (err) => (err ? reject(err) : resolve()));
  });

const makeHandler = (mw, kind) => async (req, res) => {
  try {
    await runMulter(mw, req, res);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
  if (!req.file) return res.status(400).json({ message: 'Aucun fichier reçu.' });

  try {
    const asset = await storeFile({
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      kind,
    });
    return res.status(201).json({
      message: 'Fichier téléversé avec succès.',
      url: asset.url,
      publicId: asset.publicId,
      provider: asset.provider,
      resourceType: asset.resourceType,
      bytes: asset.bytes,
      format: asset.format,
      // rétro-compat
      filename: asset.publicId?.split('/').pop(),
    });
  } catch (error) {
    console.error(`[UPLOAD:${kind}]`, error);
    return res.status(502).json({ message: "Échec du stockage du fichier.", provider: storageProvider() });
  }
};

/** POST /api/upload/image */
export const handleImageUpload = makeHandler(uploadImage, 'image');

/** POST /api/upload/document — PDF & documents */
export const handleDocumentUpload = makeHandler(uploadDocument, 'document');

/** POST /api/upload/video — vidéos de cours */
export const handleVideoUpload = makeHandler(uploadVideo, 'video');
