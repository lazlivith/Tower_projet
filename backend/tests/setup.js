/**
 * Fichier de setup global pour Vitest.
 * Charge les variables d'environnement de test avant l'import des modules.
 * 
 * IMPORTANT : Ce fichier est exécuté via `setupFiles` dans vitest.config.js
 * avant chaque fichier de test, ce qui garantit que les env vars sont
 * disponibles au moment où les modules (ex: Stripe) sont initialisés.
 */

// Variables d'environnement minimales pour les tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-super-secret-key-for-vitest-only';
process.env.FRONTEND_URL = 'http://localhost:5173';

// Clé Stripe de test (mode test — aucun vrai paiement ne sera effectué)
// Utilise une clé factice si aucune variable n'est définie
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_vitest_placeholder';
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_vitest_placeholder';
