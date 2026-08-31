import { Router } from 'express';
import { validateStudentPayment, processEnrollmentAndPayment, stripeWebhook, simulatePayment } from '../controllers/payment.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { checkoutSchema } from '../validators/payment.validator.js';

const router = Router();

// Webhook Stripe (doit être public pour que Stripe puisse l'appeler)
router.post('/webhook', stripeWebhook);

// Validation manuelle par le MANAGER
router.post('/manual-validate/:paymentId', requireAuth, validateStudentPayment);

// Initier un achat (Étudiant connecté) — avec validation Zod
router.post('/checkout', requireAuth, validate({ body: checkoutSchema }), processEnrollmentAndPayment);

// MODE TEST — Inscription + validation d'accès instantanée (sans Stripe)
router.post('/simulate', requireAuth, simulatePayment);


export default router;
