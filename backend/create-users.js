import bcrypt from 'bcrypt';
import prisma from './src/config/prisma.js';

async function seed() {
  const hash = await bcrypt.hash('password123', 10);
  
  try {
    await prisma.user.create({
      data: {
        nom: 'Super Admin',
        email: 'admin@tower.ma',
        passwordHash: hash,
        role: 'MANAGER',
        isActive: true
      }
    });

    await prisma.user.create({
      data: {
        nom: 'Professeur Ali',
        email: 'prof@tower.ma',
        passwordHash: hash,
        role: 'INSTRUCTOR',
        isActive: true
      }
    });

    await prisma.user.create({
      data: {
        nom: 'Étudiant Test',
        email: 'eleve@tower.ma',
        passwordHash: hash,
        role: 'STUDENT',
        isActive: true
      }
    });
    
    console.log('Utilisateurs créés !');
  } catch (e) {
    console.log('Erreur:', e);
  }
}

seed();
