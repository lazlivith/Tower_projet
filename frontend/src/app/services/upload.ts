import api, { toAbsoluteUrl } from './api';

export type UploadKind = 'image' | 'document' | 'video';

export interface UploadedAsset {
  /** URL absolue exploitable telle quelle (Cloudinary en prod, /uploads/… en dev). */
  url: string;
  publicId?: string;
  provider?: 'cloudinary' | 'local' | string;
  resourceType?: string;
  bytes?: number;
  format?: string | null;
}

/**
 * Téléverse un fichier via l'API (`POST /api/upload/{kind}`).
 * Le back-end route vers Cloudinary si configuré, sinon vers le disque local.
 * La `url` renvoyée est toujours absolue (passée par `toAbsoluteUrl`).
 */
export async function uploadFile(file: File, kind: UploadKind = 'image'): Promise<UploadedAsset> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await api.post(`/upload/${kind}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const data = res.data ?? {};
  return { ...data, url: toAbsoluteUrl(data.url) };
}

/** Limites côté serveur (pour information / validation UI). */
export const UPLOAD_LIMITS: Record<UploadKind, { maxMB: number; accept: string }> = {
  image: { maxMB: 5, accept: 'image/*' },
  document: { maxMB: 25, accept: 'application/pdf' },
  video: { maxMB: 300, accept: 'video/*' },
};
