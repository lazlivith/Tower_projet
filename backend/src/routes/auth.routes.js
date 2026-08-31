import { Router } from 'express';
import { register, login, forgotPassword, resetPassword, refreshToken, logout, changeInitialPassword } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/auth.validator.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting spécifique aux routes d'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de tentatives. Veuillez réessayer dans 15 minutes.' }
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nom, email, password]
 *             properties:
 *               nom: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       201:
 *         description: Utilisateur créé
 *       400:
 *         description: Erreur de validation
 */
router.post('/register', authLimiter, validate({ body: registerSchema }), register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connexion et obtention du JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Connexion réussie
 *       401:
 *         description: Identifiants invalides
 */
router.post('/login', authLimiter, validate({ body: loginSchema }), login);

/**
 * @swagger
 * /api/auth/change-initial-password:
 *   post:
 *     summary: Modification du mot de passe initial
 *     tags: [Auth]
 */
router.post('/change-initial-password', changeInitialPassword);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Demande de réinitialisation de mot de passe
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: Email envoyé si le compte existe
 */
router.post('/forgot-password', authLimiter, validate({ body: forgotPasswordSchema }), forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Réinitialisation effective du mot de passe
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Mot de passe modifié
 *       400:
 *         description: Token invalide ou expiré
 */
router.post('/reset-password', validate({ body: resetPasswordSchema }), resetPassword);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Renouvelle l'access token via le refresh token httpOnly cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Nouvel access token émis
 *       401:
 *         description: Refresh token invalide ou expiré
 */
router.post('/refresh', refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Déconnexion — révoque le refresh token et supprime le cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 */
router.post('/logout', logout);

export default router;
