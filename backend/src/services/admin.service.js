import bcrypt from 'bcrypt';
import crypto from 'crypto';
import prisma from '../config/prisma.js';
import { sendMail } from './mail.service.js';
import { instructorOnboardingEmail } from './mail.templates.js';

/**
 * Onboarding complet d'un instructeur, en une seule transaction Prisma :
 *  1. Création du compte User (rôle INSTRUCTOR, mot de passe temporaire haché, isFirstLogin=true)
 *  2. Assignation à une Classroom rattachée au Course choisi (création si aucune n'existe)
 *  3. Envoi des identifiants + lien de connexion par email (Nodemailer)
 *
 * Si l'envoi de l'email échoue, toute la transaction est annulée (rollback) :
 * aucun compte instructeur ne reste créé sans notification.
 */
export const onboardInstructorService = async ({ nom, email, courseId, classroomId }) => {
  if (!nom || !email || !courseId) {
    throw new Error("Nom, email et courseId sont requis.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Un utilisateur avec cet email existe déjà.");
  }

  const tempPassword = crypto.randomBytes(6).toString('hex'); // 12 caractères hex
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/learn/login`;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Création de l'utilisateur (isFirstLogin=true → changement de mot de passe forcé)
    const instructor = await tx.user.create({
      data: { nom, email, passwordHash, role: 'INSTRUCTOR', isActive: true, isFirstLogin: true }
    });

    // 2. Vérifier que le cours existe
    const course = await tx.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new Error("La formation spécifiée est introuvable.");
    }

    // 3. Assignation à une classe (celle fournie, la première existante, ou une classe créée par défaut)
    let targetClassroom;
    if (classroomId) {
      targetClassroom = await tx.classroom.update({
        where: { id: classroomId },
        data: { instructorId: instructor.id }
      });
    } else {
      const existingClassrooms = await tx.classroom.findMany({ where: { courseId } });
      if (existingClassrooms.length > 0) {
        targetClassroom = await tx.classroom.update({
          where: { id: existingClassrooms[0].id },
          data: { instructorId: instructor.id }
        });
      } else {
        targetClassroom = await tx.classroom.create({
          data: {
            name: `Classe principale - ${course.title}`,
            courseId: course.id,
            instructorId: instructor.id
          }
        });
      }
    }

    // 4. Envoi de l'email d'onboarding — throwOnError=true → rollback si échec
    await sendMail({
      to: email,
      subject: "Vos identifiants Instructeur - TowerStructure",
      html: instructorOnboardingEmail({
        nom,
        email,
        tempPassword,
        courseTitle: course.title,
        classroomName: targetClassroom.name,
        loginUrl,
      }),
      throwOnError: true
    });

    return {
      instructor: { id: instructor.id, nom: instructor.nom, email: instructor.email },
      classroom: targetClassroom,
      mailSent: true
    };
  }, { timeout: 15000 }); // marge pour la latence SMTP

  return result;
};
