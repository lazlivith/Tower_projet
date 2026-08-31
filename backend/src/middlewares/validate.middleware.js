import { z } from 'zod';

/**
 * Middleware de validation Zod générique et strict.
 * Accepte un objet décrivant les schémas pour body, query, et params.
 * 
 * Utilisation : router.post('/route', validate({ body: monSchema, query: monAutreSchema }), controller)
 * 
 * @param {Object} schemas - Objet contenant les schémas Zod
 * @param {z.ZodSchema} [schemas.body] - Schéma Zod à valider sur req.body
 * @param {z.ZodSchema} [schemas.query] - Schéma Zod à valider sur req.query
 * @param {z.ZodSchema} [schemas.params] - Schéma Zod à valider sur req.params
 */
export const validate = (schemas) => (req, res, next) => {
  try {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    if (schemas.query) {
      req.query = schemas.query.parse(req.query);
    }
    if (schemas.params) {
      req.params = schemas.params.parse(req.params);
    }
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => ({
        champ: err.path.join('.'),
        message: err.message,
      }));
      return res.status(400).json({
        message: 'Données invalides. Veuillez corriger les erreurs ci-dessous.',
        errors,
      });
    }
    
    return res.status(500).json({ message: 'Erreur interne de validation.' });
  }
};
