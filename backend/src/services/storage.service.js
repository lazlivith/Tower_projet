import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { cloudinary, isCloudinaryConfigured, CLOUDINARY_BASE_FOLDER } from '../config/cloudinary.js';

/**
 * Service de stockage unifié.
 *
 * En production : Cloudinary. En dev sans clés : disque local `uploads/…`.
 *
 * Arborescence — un espace par domaine fonctionnel :
 *
 *   <BASE>/blog                     images d'articles
 *   <BASE>/projects                 visuels de projets / réalisations
 *   <BASE>/services                 visuels de services
 *   <BASE>/courses/covers           couvertures de formations
 *   <BASE>/courses/videos           vidéos de cours (téléversées par les formateurs)
 *   <BASE>/courses/documents        supports PDF de cours
 *   <BASE>/certificates             certificats PDF générés
 *   <BASE>/invoices                 factures PDF générées
 *   <BASE>/avatars                  photos de profil
 *   <BASE>/misc/<type>              non catégorisé
 *
 * (<BASE> = CLOUDINARY_FOLDER, ex. "TowerCore")
 *
 * Retour homogène : { url, publicId, provider, resourceType, bytes, format, folder }
 */

const RESOURCE_BY_KIND = { image: 'image', video: 'video', document: 'raw', pdf: 'raw' };

// Domaines autorisés. `byKind` = range en sous-dossiers selon le type de média.
const SCOPES = {
  blog: { byKind: false },
  projects: { byKind: false },
  services: { byKind: false },
  courses: { byKind: true },
  certificates: { byKind: false },
  invoices: { byKind: false },
  quotes: { byKind: false },
  attestations: { byKind: false },
  avatars: { byKind: false },
  misc: { byKind: true },
};

/** Liste blanche exposée au contrôleur d'upload. */
export const UPLOAD_SCOPES = Object.keys(SCOPES);

const COURSE_SUB = { image: 'covers', video: 'videos', document: 'documents', pdf: 'documents' };
const MISC_SUB = { image: 'images', video: 'videos', document: 'documents', pdf: 'pdf' };

/** Construit le chemin de dossier relatif (sans <BASE>) pour un scope + type. */
export function resolveFolder(scope = 'misc', kind = 'image') {
  const s = SCOPES[scope] ? scope : 'misc';
  if (s === 'courses') return `courses/${COURSE_SUB[kind] || 'files'}`;
  if (s === 'misc') return `misc/${MISC_SUB[kind] || 'files'}`;
  return s;
}

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

/** Upload d'un buffer vers Cloudinary via stream (pas de fichier temporaire). */
const cloudinaryUpload = (buffer, { folder, resourceType, publicId }) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${CLOUDINARY_BASE_FOLDER}/${folder}`,
        resource_type: resourceType,
        ...(publicId ? { public_id: publicId } : {}),
        unique_filename: true,
        overwrite: false,
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });

/**
 * Enregistre un fichier.
 * @param {object} p
 * @param {Buffer} p.buffer                       contenu du fichier
 * @param {string} [p.originalname]               nom d'origine (pour l'extension)
 * @param {'image'|'video'|'document'|'pdf'} [p.kind='image']
 * @param {keyof typeof SCOPES} [p.scope='misc']  domaine fonctionnel (dossier)
 * @param {string} [p.publicId]                   identifiant Cloudinary souhaité
 */
export const storeFile = async ({ buffer, originalname = '', kind = 'image', scope = 'misc', publicId }) => {
  const resourceType = RESOURCE_BY_KIND[kind] || 'image';
  const folder = resolveFolder(scope, kind);
  const ext = (path.extname(originalname) || '').toLowerCase();

  if (isCloudinaryConfigured) {
    const result = await cloudinaryUpload(buffer, { folder, resourceType, publicId });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      provider: 'cloudinary',
      resourceType: result.resource_type,
      bytes: result.bytes,
      format: result.format || ext.replace('.', '') || null,
      folder: `${CLOUDINARY_BASE_FOLDER}/${folder}`,
    };
  }

  // --- Fallback disque local (même arborescence) ---
  const dir = path.resolve('uploads', folder);
  ensureDir(dir);
  const filename = `${uuidv4()}${ext}`;
  fs.writeFileSync(path.join(dir, filename), buffer);
  return {
    url: `/uploads/${folder}/${filename}`,
    publicId: `uploads/${folder}/${filename}`,
    provider: 'local',
    resourceType,
    bytes: buffer.length,
    format: ext.replace('.', '') || null,
    folder: `uploads/${folder}`,
  };
};

/**
 * Supprime un fichier précédemment stocké.
 * Accepte soit { publicId, resourceType }, soit { url } (déduction du provider).
 */
export const deleteFile = async ({ publicId, url, resourceType = 'image' }) => {
  try {
    const looksLocal = (publicId && publicId.startsWith('uploads/')) || (url && url.startsWith('/uploads/'));

    if (looksLocal || !isCloudinaryConfigured) {
      const rel = publicId?.startsWith('uploads/') ? publicId : (url || '').replace(/^\//, '');
      if (rel && rel.startsWith('uploads/')) {
        const abs = path.resolve(rel);
        if (fs.existsSync(abs)) fs.unlinkSync(abs);
      }
      return { deleted: true, provider: 'local' };
    }

    let id = publicId;
    if (!id && url) {
      // Extrait le public_id d'une URL Cloudinary : …/upload/v123/<dossiers/public_id>.<ext>
      const m = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?$/i);
      id = m ? m[1] : null;
    }
    if (!id) return { deleted: false, reason: 'publicId introuvable' };

    const res = await cloudinary.uploader.destroy(id, { resource_type: resourceType });
    return { deleted: res.result === 'ok', provider: 'cloudinary', result: res.result };
  } catch (error) {
    console.error('[STORAGE] deleteFile:', error.message);
    return { deleted: false, error: error.message };
  }
};

export const storageProvider = () => (isCloudinaryConfigured ? 'cloudinary' : 'local');
