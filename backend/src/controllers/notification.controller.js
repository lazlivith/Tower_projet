import prisma from '../config/prisma.js';

// Récupérer les notifications non lues
export const getNotifications = async (req, res) => {
  const userId = req.user.id;
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(notifications);
  } catch (error) {
    return res.status(500).json({ message: "Erreur récupération des notifications." });
  }
};

// Marquer une notification comme lue
export const markNotificationRead = async (req, res) => {
  const { id } = req.params;
  try {
    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    return res.status(200).json(notification);
  } catch (error) {
    return res.status(500).json({ message: "Erreur mise à jour notification." });
  }
};

// Marquer tout comme lu
export const markAllRead = async (req, res) => {
  const userId = req.user.id;
  try {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
    return res.status(200).json({ message: "Toutes les notifications sont lues." });
  } catch (error) {
    return res.status(500).json({ message: "Erreur mise à jour notifications." });
  }
};
