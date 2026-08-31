import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/prisma.js';
import { sendMail } from '../services/mail.service.js';
import { passwordResetEmail } from '../services/mail.templates.js';

const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');

/**
 * Génère un access token JWT de courte durée (15 minutes)
 */
const generateAccessToken = (user) => jwt.sign(
  { id: user.id, role: user.role, activeAccesses: user.activeAccesses || [] },
  process.env.JWT_SECRET,
  { expiresIn: '15m' }
);

/**
 * Génère un refresh token opaque (256 bits) et le persiste en BDD sous forme de hash SHA-256.
 * @returns {{ rawToken: string, expiresAt: Date }}
 */
const generateAndSaveRefreshToken = async (userId) => {
  const rawToken = crypto.randomBytes(32).toString('hex'); // 64 chars hex
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt }
  });

  return { rawToken, expiresAt };
};

/**
 * Options du cookie httpOnly pour le refresh token
 */
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours en ms
  path: '/api/auth' // Cookie uniquement envoyé sur les routes d'auth
};

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────

/**
 * Inscription d'un nouvel utilisateur (Rôle STUDENT par défaut)
 */
export const register = async (req, res) => {
  try {
    const { nom, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "Un utilisateur avec cet email existe déjà." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { nom, email, passwordHash, role: 'STUDENT', isFirstLogin: false },
    });

    return res.status(201).json({
      message: "Inscription réussie.",
      user: { id: user.id, nom: user.nom, email: user.email, role: user.role, isActive: user.isActive }
    });
  } catch (error) {
    console.error("[AUTH] Erreur lors de l'inscription :", error);
    return res.status(500).json({ message: "Erreur interne lors de l'inscription." });
  }
};

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────

/**
 * Authentification — Retourne un access token (15min) + set un refresh token httpOnly cookie (7j)
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        enrollments: { select: { courseId: true, accessStatus: true } }
      }
    });

    if (!user) return res.status(401).json({ message: "Identifiants incorrects." });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: "Identifiants incorrects." });

    if (!user.isActive) return res.status(403).json({ message: "Votre compte est désactivé. Contactez l'administration." });

    if (user.isFirstLogin) {
      // Si c'est la première connexion (compte créé par un admin), on empêche l'accès complet
      return res.status(403).json({
        requirePasswordChange: true,
        message: "Veuillez modifier votre mot de passe temporaire pour continuer.",
        email: user.email // pour pré-remplir le formulaire côté client
      });
    }

    const activeAccesses = user.enrollments
      .filter(e => e.accessStatus === 'ACTIVE')
      .map(e => e.courseId);
    const pendingAccesses = user.enrollments
      .filter(e => e.accessStatus === 'SUSPENDED')
      .map(e => e.courseId);
    // Instructeurs/managers ont toujours accès à leur espace ; les étudiants doivent avoir payé.
    const hasActiveAccess = user.role !== 'STUDENT' || activeAccesses.length > 0;

    // 1. Access token (courte durée — 15 min)
    const accessToken = generateAccessToken({ ...user, activeAccesses });

    // 2. Refresh token (longue durée — 7j, persisté en BDD sous forme hachée)
    const { rawToken } = await generateAndSaveRefreshToken(user.id);

    // 3. Envoi du refresh token dans un cookie httpOnly sécurisé
    res.cookie('refreshToken', rawToken, REFRESH_COOKIE_OPTIONS);

    return res.status(200).json({
      message: "Connexion réussie.",
      accessToken,
      user: {
        id: user.id, nom: user.nom, email: user.email, role: user.role, isActive: user.isActive,
        hasActiveAccess, activeAccesses, pendingAccesses
      }
    });
  } catch (error) {
    console.error("[AUTH] Erreur lors de la connexion :", error);
    return res.status(500).json({ message: "Erreur interne lors de la connexion." });
  }
};

// ─────────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────────

/**
 * Renouvelle silencieusement l'access token à partir du refresh token httpOnly cookie.
 * Applique la rotation : supprime l'ancien token et en génère un nouveau.
 */
export const refreshToken = async (req, res) => {
  try {
    const rawToken = req.cookies?.refreshToken;

    if (!rawToken) {
      return res.status(401).json({ message: "Refresh token manquant. Veuillez vous reconnecter." });
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Rechercher le token en BDD
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: { enrollments: { select: { courseId: true, accessStatus: true } } }
        }
      }
    });

    if (!storedToken) {
      // Token introuvable → possible attaque par token volé → supprimer tous les tokens du user si possible
      res.clearCookie('refreshToken', { path: '/api/auth' });
      return res.status(401).json({ message: "Refresh token invalide. Veuillez vous reconnecter." });
    }

    // Vérifier l'expiration
    if (new Date() > storedToken.expiresAt) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      res.clearCookie('refreshToken', { path: '/api/auth' });
      return res.status(401).json({ message: "Session expirée. Veuillez vous reconnecter." });
    }

    const user = storedToken.user;

    if (!user.isActive) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      res.clearCookie('refreshToken', { path: '/api/auth' });
      return res.status(403).json({ message: "Compte désactivé." });
    }

    // ─── ROTATION ───
    // Invalider l'ancien token et en créer un nouveau (prevents replay attacks)
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    const { rawToken: newRawToken } = await generateAndSaveRefreshToken(user.id);

    const activeAccesses = user.enrollments
      .filter(e => e.accessStatus === 'ACTIVE')
      .map(e => e.courseId);

    const accessToken = generateAccessToken({ ...user, activeAccesses });

    // Mettre à jour le cookie avec le nouveau refresh token
    res.cookie('refreshToken', newRawToken, REFRESH_COOKIE_OPTIONS);

    const hasActiveAccess = user.role !== 'STUDENT' || activeAccesses.length > 0;
    const pendingAccesses = user.enrollments
      .filter(e => e.accessStatus === 'SUSPENDED')
      .map(e => e.courseId);

    return res.status(200).json({
      message: "Token renouvelé avec succès.",
      accessToken,
      user: {
        id: user.id, nom: user.nom, email: user.email, role: user.role, isActive: user.isActive,
        hasActiveAccess, activeAccesses, pendingAccesses
      }
    });
  } catch (error) {
    console.error("[AUTH] Erreur refresh token :", error);
    return res.status(500).json({ message: "Erreur interne." });
  }
};

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────

/**
 * Déconnexion — Révoque le refresh token en BDD et supprime le cookie.
 */
export const logout = async (req, res) => {
  try {
    const rawToken = req.cookies?.refreshToken;

    if (rawToken) {
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      // Supprimer silencieusement (pas d'erreur si déjà révoqué)
      await prisma.refreshToken.deleteMany({ where: { tokenHash } });
    }

    res.clearCookie('refreshToken', { path: '/api/auth' });
    return res.status(200).json({ message: "Déconnexion réussie." });
  } catch (error) {
    console.error("[AUTH] Erreur logout :", error);
    return res.status(500).json({ message: "Erreur interne." });
  }
};

// ─────────────────────────────────────────────
// FORGOT / RESET PASSWORD / FIRST LOGIN
// ─────────────────────────────────────────────

/**
 * Changement du mot de passe initial
 */
export const changeInitialPassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isFirstLogin) {
      return res.status(400).json({ message: "Action non autorisée ou déjà effectuée." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Mot de passe actuel incorrect." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, isFirstLogin: false }
    });

    return res.status(200).json({ message: "Mot de passe mis à jour avec succès. Vous pouvez maintenant vous connecter." });
  } catch (error) {
    console.error("[AUTH] Erreur change-initial-password :", error);
    return res.status(500).json({ message: "Erreur interne." });
  }
};

/**
 * Demande de réinitialisation de mot de passe
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    // Toujours répondre 200 pour ne pas exposer si l'email existe
    if (!user) {
      return res.status(200).json({ message: "Si cet email existe, un lien de réinitialisation a été envoyé." });
    }

    const token = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    // Un seul jeton actif à la fois : on purge les précédents non utilisés
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: sha256(token), expiresAt }
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/learn/reset-password?token=${token}`;

    await sendMail({
      to: email,
      subject: 'Réinitialisation de votre mot de passe — TowerStructure',
      html: passwordResetEmail({ resetUrl })
    });

    return res.status(200).json({ message: "Si cet email existe, un lien de réinitialisation a été envoyé." });
  } catch (error) {
    console.error("[AUTH] Erreur forgot-password :", error);
    return res.status(500).json({ message: "Erreur interne." });
  }
};

/**
 * Réinitialisation effective du mot de passe
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const stored = await prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(token) } });
    if (!stored || stored.usedAt) {
      return res.status(400).json({ message: "Token invalide ou déjà utilisé." });
    }
    if (new Date() > stored.expiresAt) {
      await prisma.passwordResetToken.delete({ where: { id: stored.id } });
      return res.status(400).json({ message: "Ce lien de réinitialisation a expiré. Veuillez en demander un nouveau." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({ where: { id: stored.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: stored.id }, data: { usedAt: new Date() } }),
      // Révoquer tous les refresh tokens de l'utilisateur (sécurité renforcée après reset)
      prisma.refreshToken.deleteMany({ where: { userId: stored.userId } }),
    ]);

    return res.status(200).json({ message: "Mot de passe réinitialisé avec succès. Vous pouvez vous connecter." });
  } catch (error) {
    console.error("[AUTH] Erreur reset-password :", error);
    return res.status(500).json({ message: "Erreur interne." });
  }
};
