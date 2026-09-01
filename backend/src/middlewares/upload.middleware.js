import multer from 'multer';

/**
 * Uploads en mémoire (Buffer) — le fichier est ensuite poussé vers Cloudinary
 * (ou écrit sur disque en fallback) par `storage.service.js`. Aucune écriture
 * disque intermédiaire.
 */

const memory = multer.memoryStorage();

/** Image (max 5 MB) */
export const uploadImage = multer({
  storage: memory,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Seuls les fichiers image sont acceptés.'));
    }
    cb(null, true);
  },
}).single('file');

/** Document PDF (max 25 MB) */
export const uploadDocument = multer({
  storage: memory,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype === 'application/pdf' || /\.pdf$/i.test(file.originalname);
    if (!ok) return cb(new Error('Seuls les fichiers PDF sont acceptés.'));
    cb(null, true);
  },
}).single('file');

/** Vidéo de cours (max 300 MB) */
export const uploadVideo = multer({
  storage: memory,
  limits: { fileSize: 300 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('video/')) {
      return cb(new Error('Seuls les fichiers vidéo sont acceptés.'));
    }
    cb(null, true);
  },
}).single('file');

/**
 * Fichier tableur (.xlsx / .xls) en mémoire — parsé puis jeté (import de Quiz).
 */
export const uploadSpreadsheet = multer({
  storage: memory,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream',
    ].includes(file.mimetype) || /\.xlsx?$/i.test(file.originalname);
    if (!ok) return cb(new Error('Seuls les fichiers Excel (.xlsx, .xls) sont acceptés.'));
    cb(null, true);
  },
}).single('file');
