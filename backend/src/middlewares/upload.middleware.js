import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Créer les dossiers si inexistants
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

ensureDir('uploads/images');
ensureDir('uploads/documents');
ensureDir('uploads/pdfs');

/**
 * Crée un storage multer pour un sous-dossier donné
 */
const createStorage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => cb(null, `uploads/${folder}`),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

/**
 * Upload d'image (max 5 MB)
 */
export const uploadImage = multer({
  storage: createStorage('images'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Seuls les fichiers image sont acceptés.'));
    }
    cb(null, true);
  }
}).single('file');

/**
 * Upload de document PDF (max 20 MB)
 */
export const uploadDocument = multer({
  storage: createStorage('documents'),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Seuls les fichiers PDF sont acceptés.'));
    }
    cb(null, true);
  }
}).single('file');

/**
 * Upload d'un fichier tableur (.xlsx / .xls) en mémoire — parsé puis jeté (pas de persistance disque).
 * Utilisé pour l'import de Quiz par l'instructeur.
 */
export const uploadSpreadsheet = multer({
  storage: multer.memoryStorage(),
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

/**
 * Stockage interne pour les PDFs générés (factures, certificats)
 */
export const pdfStorage = createStorage('pdfs');
