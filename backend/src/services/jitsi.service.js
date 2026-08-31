import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

/**
 * Intégration Jitsi Meet.
 *
 * - `JITSI_DOMAIN`      : domaine (défaut meet.jit.si)
 * - `JITSI_APP_ID`      : app id / iss / aud (JaaS ou instance self-hosted avec auth JWT)
 * - `JITSI_APP_SECRET`  : secret HS256 pour signer les jetons
 *
 * Si `JITSI_APP_SECRET` n'est pas défini, on retombe sur une salle publique sans jeton.
 */
const DOMAIN = process.env.JITSI_DOMAIN || 'meet.jit.si';
const APP_ID = process.env.JITSI_APP_ID || 'towerstructure';
const APP_SECRET = process.env.JITSI_APP_SECRET || null;

export const isJitsiAuthEnabled = () => !!APP_SECRET;

/** Génère un nom de salle unique et non devinable. */
export const generateRoomName = (prefix = 'TowerStructure') => `${prefix}-${uuidv4()}`;

/** URL de base d'une salle (sans jeton). */
export const buildRoomUrl = (room) => `https://${DOMAIN}/${room}`;

/**
 * Jeton JWT Jitsi scoping l'accès à une salle pour un utilisateur donné.
 * @returns {string|null} null si l'auth Jitsi n'est pas configurée
 */
export const createJitsiToken = ({ room, user, moderator = false, ttlSeconds = 2 * 60 * 60 }) => {
  if (!APP_SECRET) return null;

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: APP_ID,
    iss: APP_ID,
    sub: DOMAIN,
    room,
    iat: now,
    nbf: now - 10,
    exp: now + ttlSeconds,
    context: {
      user: {
        id: user.id,
        name: user.nom || user.name || 'Participant',
        email: user.email || undefined,
        moderator,
      },
    },
  };

  return jwt.sign(payload, APP_SECRET, { algorithm: 'HS256' });
};

/**
 * Construit l'URL de connexion complète (avec jeton si disponible) pour un utilisateur.
 */
export const buildJoinUrl = ({ room, user, moderator = false }) => {
  const base = buildRoomUrl(room);
  const token = createJitsiToken({ room, user, moderator });
  return { url: token ? `${base}?jwt=${token}` : base, room, domain: DOMAIN, token, authEnabled: !!token };
};
