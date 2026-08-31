import swaggerJsdoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TowerStructure API',
      version: '1.0.0',
      description: 'Documentation de l\'API backend TowerWeb / Tower-Learn',
    },
    servers: [{ url: process.env.API_PUBLIC_URL || 'http://localhost:5000', description: 'Développement' }],
    tags: [
      { name: 'Auth', description: 'Authentification, JWT, refresh token, mot de passe' },
      { name: 'Courses', description: 'Catalogue public et contenu des formations' },
      { name: 'Student', description: 'Espace étudiant : tableau de bord, progression' },
      { name: 'Instructor', description: 'Espace instructeur : classes, leçons, sessions' },
      { name: 'Admin', description: 'Cockpit SuperAdmin / Manager : onboarding, inscriptions, certificats' },
      { name: 'Payments', description: 'Stripe Checkout, webhooks, validation des encaissements' },
      { name: 'Quotes', description: 'Demandes de devis (vitrine)' },
      { name: 'CMS', description: 'Contenu vitrine géré par l\'admin : publications, projets' },
      { name: 'Sessions', description: 'Sessions live Jitsi' },
      { name: 'Assignments', description: 'Devoirs et soumissions' },
      { name: 'Notifications', description: 'Notifications utilisateur' },
      { name: 'Messaging', description: 'Messagerie interne' },
      { name: 'Stats', description: 'Statistiques par rôle' },
      { name: 'Upload', description: 'Téléversement d\'images et documents' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      responses: {
        Unauthorized: { description: 'Token manquant, invalide ou expiré' },
        Forbidden: { description: 'Rôle ou permissions insuffisants' },
        ValidationError: { description: 'Corps de requête invalide (Zod)' },
        NotFound: { description: 'Ressource introuvable' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../controllers/*.js'),
  ],
};

let swaggerSpec;
try {
  swaggerSpec = swaggerJsdoc(options);
} catch (err) {
  console.error('[SWAGGER] Erreur:', err.message);
  swaggerSpec = { openapi: '3.0.0', info: { title: 'TowerStructure API', version: '1.0.0' }, paths: {} };
}

/**
 * Serve Swagger UI using a standalone HTML page (Express v5 compatible)
 */
export const setupSwagger = (app) => {
  // Serve the OpenAPI JSON spec
  app.get('/api/docs/swagger.json', (req, res) => {
    res.json(swaggerSpec);
  });

  // Serve Swagger UI via CDN (no Express middleware needed)
  app.get('/api/docs', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>TowerStructure API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css"/>
  <style>body{margin:0} .topbar{display:none!important}</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/docs/swagger.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: 'BaseLayout'
    });
  </script>
</body>
</html>`);
  });
};
