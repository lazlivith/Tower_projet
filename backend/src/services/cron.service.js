import cron from 'node-cron';
import prisma from '../config/prisma.js';

/**
 * Initialise et démarre les tâches planifiées (Cron Jobs).
 */
export const startCronJobs = () => {
  // Purger les refresh tokens expirés tous les jours à 3h00 du matin
  cron.schedule('0 3 * * *', async () => {
    try {
      console.log('🧹 [CRON] Démarrage du nettoyage des RefreshTokens expirés...');
      
      const [refresh, reset] = await Promise.all([
        prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
        prisma.passwordResetToken.deleteMany({
          where: { OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }] },
        }),
      ]);

      console.log(`🧹 [CRON] Nettoyage : ${refresh.count} refresh tokens + ${reset.count} reset tokens supprimés.`);
    } catch (error) {
      console.error('❌ [CRON] Erreur lors du nettoyage des RefreshTokens :', error);
    }
  });

  console.log('[CRON] Tâches planifiées initialisées (Nettoyage quotidien à 03:00).');
};
