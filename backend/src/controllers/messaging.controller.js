import prisma from '../config/prisma.js';

// Récupérer les messages (boîte de réception)
export const getInbox = async (req, res) => {
  const userId = req.user.id;
  try {
    const messages = await prisma.message.findMany({
      where: { receiverId: userId },
      include: { sender: { select: { nom: true, role: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de la récupération des messages." });
  }
};

// Envoyer un message
export const sendMessage = async (req, res) => {
  const senderId = req.user.id;
  const { receiverId, content } = req.body;
  try {
    const message = await prisma.message.create({
      data: { senderId, receiverId, content }
    });
    return res.status(201).json(message);
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de l'envoi du message." });
  }
};

// Marquer comme lu
export const markAsRead = async (req, res) => {
  const { messageId } = req.params;
  try {
    const message = await prisma.message.update({
      where: { id: messageId },
      data: { isRead: true }
    });
    return res.status(200).json(message);
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de la mise à jour du message." });
  }
};
