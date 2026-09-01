import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { cloudinary, isCloudinaryConfigured, CLOUDINARY_BASE_FOLDER } from '../config/cloudinary.js';

/**
 * Service de stockage unifié.
 *
 * En production : Cloudinary (images / vidéos / PDF & documents « raw »).
 * En dev sans clés Cloudinary : disque local `uploads/…` servi par express.static.
 *
 * Toutes les fonctions renvoient une forme homogène :
 *   { url, publicId, provider, resourceType, bytes, format }
 * `url` est TOUJOURS exploitable tel quel par le front (absolue pour Cloudinary,
 * relative « /uploads/… » pour le disque — `toAbsoluteUrl` côté front la complète).
 */

const KIND_MAP = {
  image: { folder: 'images', resourceType: 'image' },
  video: { folder: 'videos', resourceType: 'video' },
  document: { folder: 'documents', resourceType: 'raw' },
  pdf: { folder: 'pdfs', resourceType: 'raw' },
};

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

/** Upload d'un buffer Cloudinary via stream (pas de fichier temporaire). */
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
 * @param {Buffer} p.buffer        contenu du fichier
 * @param {string} p.originalname  nom d'origine (pour l'extension)
 * @param {'image'|'video'|'document'|'pdf'} [p.kind='image']
 * @param {string} [p.publicId]    identifiant Cloudinary souhaité (optionnel)
 */
export const storeFile = async ({ buffer, originalname = '', kind = 'image', publicId }) => {
  const { folder, resourceType } = KIND_MAP[kind] || KIND_MAP.image;
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
    };
  }

  // --- Fallback disque local ---
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
      // Extrait le public_id d'une URL Cloudinary : …/upload/v123/<public_id>.<ext>
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
