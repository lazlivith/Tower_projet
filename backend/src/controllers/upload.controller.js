import { uploadImage, uploadDocument, uploadVideo } from '../middlewares/upload.middleware.js';
import { storeFile, storageProvider, UPLOAD_SCOPES } from '../services/storage.service.js';

/** Wrappe un middleware multer `.single('file')` en promesse. */
const runMulter = (mw, req, res) =>
  new Promise((resolve, reject) => {
    mw(req, res, (err) => (err ? reject(err) : resolve()));
  });

const makeHandler = (mw, kind, defaultScope) => async (req, res) => {
  try {
    await runMulter(mw, req, res);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
  if (!req.file) return res.status(400).json({ message: 'Aucun fichier reçu.' });

  // `scope` = domaine de rangement (blog, projects, courses, …). Body (multipart) ou query.
  const requested = (req.body?.scope || req.query?.scope || '').toString().trim();
  if (requested && !UPLOAD_SCOPES.includes(requested)) {
    return res.status(400).json({
      message: `scope invalide : "${requested}". Valeurs acceptées : ${UPLOAD_SCOPES.join(', ')}.`,
    });
  }
  const scope = requested || defaultScope;

  try {
    const asset = await storeFile({
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      kind,
      scope,
    });
    return res.status(201).json({
      message: 'Fichier téléversé avec succès.',
      url: asset.url,
      publicId: asset.publicId,
      provider: asset.provider,
      resourceType: asset.resourceType,
      bytes: asset.bytes,
      format: asset.format,
      folder: asset.folder,
      scope,
      // rétro-compat
      filename: asset.publicId?.split('/').pop(),
    });
  } catch (error) {
    console.error(`[UPLOAD:${kind}/${scope}]`, error);
    return res.status(502).json({ message: 'Échec du stockage du fichier.', provider: storageProvider() });
  }
};

/** POST /api/upload/image  — ?scope=blog|projects|services|courses|avatars|misc */
export const handleImageUpload = makeHandler(uploadImage, 'image', 'misc');

/** POST /api/upload/document — supports PDF de cours par défaut */
export const handleDocumentUpload = makeHandler(uploadDocument, 'document', 'courses');

/** POST /api/upload/video — vidéos de cours par défaut */
export const handleVideoUpload = makeHandler(uploadVideo, 'video', 'courses');
