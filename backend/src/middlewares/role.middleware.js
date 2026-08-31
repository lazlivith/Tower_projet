// src/middlewares/role.middleware.js

/**
 * Restreint l'accès à une route à une liste de rôles autorisés.
 *
 * Accepte indifféremment :
 *   - un tableau  : restrictToRole(['MANAGER'])
 *   - des varargs : restrictToRole('INSTRUCTOR', 'MANAGER')
 *
 * `req.user` est injecté en amont par le middleware d'authentification (requireAuth).
 */
export const restrictToRole = (...roles) => {
  const allowedRoles = roles.flat();

  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Accès refusé : Vous n'avez pas les permissions nécessaires pour effectuer cette action."
      });
    }
    next();
  };
};

/**
 * Alias rétro-compatible — à terme, préférer `restrictToRole`.
 * @deprecated Utiliser `restrictToRole` (signature tableau) — cf. cahier des charges W2.
 */
export const requireRole = restrictToRole;
