/**
 * Middleware global de gestion d'erreurs Express.
 * À monter EN DERNIER dans app.js : app.use(errorHandler)
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Une erreur interne est survenue.';

  // Erreurs Prisma — traduction des codes courants
  if (err.code === 'P2002') {
    return res.status(409).json({
      message: 'Une ressource avec ces données existe déjà (contrainte d\'unicité).',
      champ: err.meta?.target
    });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Ressource introuvable.' });
  }

  // Log de l'erreur (en production, éviter d'exposer le stack)
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ERROR] ${statusCode} — ${message}`);
    if (err.stack) console.error(err.stack);
  } else {
    console.error(`[ERROR] ${statusCode} — ${message}`);
  }

  return res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};
