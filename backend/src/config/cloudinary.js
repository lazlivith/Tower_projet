import { v2 as cloudinary } from 'cloudinary';

/**
 * Configuration Cloudinary — gestion centralisée des médias (images, PDF, vidéos…).
 *
 * Fournir SOIT `CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>`
 * SOIT le trio `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`.
 *
 * Si aucune variable n'est définie, `isCloudinaryConfigured` vaut false et les
 * uploads basculent automatiquement sur le stockage disque local (dev).
 */

const {
  CLOUDINARY_URL,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_FOLDER,
} = process.env;

export const isCloudinaryConfigured = Boolean(
  CLOUDINARY_URL || (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET)
);

/** Préfixe de dossier pour tous les assets du projet (ex: "tower"). */
export const CLOUDINARY_BASE_FOLDER = CLOUDINARY_FOLDER || 'tower';

if (isCloudinaryConfigured) {
  // Le SDK lit CLOUDINARY_URL tout seul ; on force quand même l'objet si le trio est fourni.
  cloudinary.config({
    ...(CLOUDINARY_CLOUD_NAME ? { cloud_name: CLOUDINARY_CLOUD_NAME } : {}),
    ...(CLOUDINARY_API_KEY ? { api_key: CLOUDINARY_API_KEY } : {}),
    ...(CLOUDINARY_API_SECRET ? { api_secret: CLOUDINARY_API_SECRET } : {}),
    secure: true,
  });
  console.log(`[CLOUDINARY] Actif — cloud "${cloudinary.config().cloud_name}", dossier "${CLOUDINARY_BASE_FOLDER}".`);
} else {
  console.log('[CLOUDINARY] Non configuré — les fichiers seront stockés sur le disque local (mode dev).');
}

export { cloudinary };
