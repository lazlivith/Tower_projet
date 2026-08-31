import 'dotenv/config';
import pkg from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const { PrismaClient } = pkg;
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/** Récupère un cours par titre, le crée sinon (pas de champ unique autre que l'id). */
async function upsertCourseByTitle(data) {
  const existing = await prisma.course.findFirst({ where: { title: data.title } });
  if (existing) return prisma.course.update({ where: { id: existing.id }, data });
  return prisma.course.create({ data });
}

async function upsertClassroom(courseId, name, instructorId) {
  const existing = await prisma.classroom.findFirst({ where: { courseId, name } });
  if (existing) return prisma.classroom.update({ where: { id: existing.id }, data: { instructorId } });
  return prisma.classroom.create({ data: { courseId, name, instructorId } });
}

async function main() {
  console.log('🌱 [SEED] Démarrage de l\'initialisation des données de démonstration...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // ─── Utilisateurs de démo ────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tower.ma' },
    update: { passwordHash, isActive: true, isFirstLogin: false },
    create: { nom: 'Admin Tower', email: 'admin@tower.ma', passwordHash, role: 'MANAGER', isActive: true, isFirstLogin: false },
  });
  const instructor = await prisma.user.upsert({
    where: { email: 'prof@tower.ma' },
    update: { passwordHash, isActive: true, isFirstLogin: false },
    create: { nom: 'Professeur Demo', email: 'prof@tower.ma', passwordHash, role: 'INSTRUCTOR', isActive: true, isFirstLogin: false },
  });
  const student = await prisma.user.upsert({
    where: { email: 'eleve@tower.ma' },
    update: { passwordHash, isActive: true, isFirstLogin: false },
    create: { nom: 'Élève Demo', email: 'eleve@tower.ma', passwordHash, role: 'STUDENT', isActive: true, isFirstLogin: false },
  });
  console.log(`✅ Comptes : ${admin.email}, ${instructor.email}, ${student.email} (mot de passe : password123)`);

  // ─── Cours + classes ─────────────────────────────────────────────────────
  const course = await upsertCourseByTitle({
    title: 'Introduction au BIM & Eurocodes',
    description: "Maîtrisez les fondamentaux du Building Information Modeling et des calculs Eurocodes pour l'ingénierie structurelle.",
    durationHours: 40,
    price: 1500,
    level: 'Débutant',
    isPublished: true,
  });
  const course2 = await upsertCourseByTitle({
    title: 'Calcul des Structures en Béton Armé',
    description: 'Techniques avancées de calcul des structures en béton armé selon les normes EN 1992.',
    durationHours: 60,
    price: 2200,
    level: 'Intermédiaire',
    isPublished: true,
  });

  const classroom = await upsertClassroom(course.id, 'Promotion Démo', instructor.id);
  await upsertClassroom(course2.id, 'Classe principale - Béton Armé', instructor.id);
  console.log(`✅ Cours : "${course.title}" (classe : ${classroom.name}), "${course2.title}"`);

  // ─── Leçons du cours 1 (déblocage séquentiel + vidéo YouTube) ────────────
  const lessonsData = [
    { title: 'Chapitre 1 — Présentation du BIM', sequenceOrder: 1, videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    { title: 'Chapitre 2 — Les niveaux de détail (LOD)', sequenceOrder: 2, videoUrl: 'https://youtu.be/dQw4w9WgXcQ' },
    { title: 'Chapitre 3 — Introduction aux Eurocodes', sequenceOrder: 3, videoUrl: null },
    { title: 'Chapitre 4 — Étude de cas', sequenceOrder: 4, videoUrl: null },
  ];
  const lessons = [];
  for (const l of lessonsData) {
    let lesson = await prisma.moduleLesson.findFirst({ where: { courseId: course.id, sequenceOrder: l.sequenceOrder } });
    lesson = lesson
      ? await prisma.moduleLesson.update({ where: { id: lesson.id }, data: { title: l.title, videoUrl: l.videoUrl } })
      : await prisma.moduleLesson.create({ data: { ...l, courseId: course.id } });
    lessons.push(lesson);
  }
  console.log(`✅ ${lessons.length} chapitres créés pour "${course.title}"`);

  // ─── Quiz de démo (rattaché à la classe + chapitre 2) ───────────────────
  const existingQuiz = await prisma.quiz.findFirst({ where: { classroomId: classroom.id } });
  if (!existingQuiz) {
    await prisma.quiz.create({
      data: {
        classroomId: classroom.id,
        lessonId: lessons[1].id,
        title: 'Quiz — Niveaux de détail',
        passScore: 70,
        questions: [
          { question: 'Que signifie LOD ?', options: { A: 'Level of Development', B: 'List of Data', C: 'Load Design', D: 'Level of Density' }, correctAnswer: 'A' },
          { question: 'Le BIM est avant tout…', options: { A: 'un logiciel', B: 'un processus collaboratif', C: 'une norme', D: 'un format de fichier' }, correctAnswer: 'B' },
          { question: 'LOD 350 correspond à…', options: { A: 'esquisse', B: 'conception', C: 'coordination détaillée', D: 'exploitation' }, correctAnswer: 'C' },
        ],
      },
    });
    console.log('✅ Quiz de démo créé');
  }

  // ─── Inscription de l'étudiant (accès actif) + progression ──────────────
  const enrollment = await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
    update: { accessStatus: 'ACTIVE' },
    create: {
      studentId: student.id,
      courseId: course.id,
      classroomId: classroom.id,
      paymentPlan: 'FULL',
      accessStatus: 'ACTIVE',
    },
  });
  await prisma.progress.createMany({
    data: lessons.map((l) => ({ studentId: student.id, lessonId: l.id, isCompleted: false })),
    skipDuplicates: true,
  });
  console.log(`✅ Inscription active : ${student.email} → "${course.title}"`);

  // ─── Contenu vitrine (blog + projets) ──────────────────────────────────
  if ((await prisma.publication.count()) === 0) {
    await prisma.publication.createMany({
      data: [
        {
          title: 'Le BIM au service de la conception parasismique',
          excerpt: "Comment la maquette numérique fiabilise les calculs sismiques dès l'esquisse.",
          category: 'BIM',
          content: "La maquette numérique (BIM) permet de centraliser les données géométriques et structurelles...\n\nEn phase de conception parasismique, elle offre une base fiable pour les analyses modales et le dimensionnement selon l'Eurocode 8.",
          status: 'PUBLISHED',
        },
        {
          title: 'Diagnostic structurel : les 5 signaux à ne pas ignorer',
          excerpt: 'Fissures, flèches, corrosion… un guide rapide pour prioriser les interventions.',
          category: 'Diagnostic',
          content: "Un diagnostic structurel commence toujours par une inspection visuelle méthodique...",
          status: 'PUBLISHED',
        },
        {
          title: 'Brouillon — Nouveautés Eurocodes 2026',
          excerpt: 'À paraître.',
          category: 'Eurocodes',
          content: 'Contenu en cours de rédaction.',
          status: 'DRAFT',
        },
      ],
    });
    console.log('✅ 3 publications de démo créées');
  }

  if ((await prisma.project.count()) === 0) {
    await prisma.project.createMany({
      data: [
        { title: 'Résidence Al Andalous — Rabat', description: 'Immeuble R+8 en béton armé, étude complète de structure et note de calcul Eurocode.', category: 'Résidentiel', status: 'COMPLETED', isPublished: true },
        { title: 'Centre commercial Marina — Casablanca', description: 'Charpente métallique de grande portée, 12 000 m² de plancher.', category: 'Commercial', status: 'COMPLETED', isPublished: true },
        { title: 'Pont sur l’Oued Bouregreg', description: 'Assistance technique et contrôle d’exécution — ouvrage en cours.', category: 'Infrastructure', status: 'ONGOING', isPublished: true },
        { title: 'Extension hôpital régional', description: 'Renforcement parasismique d’un bâtiment existant — chantier en cours.', category: 'Santé', status: 'ONGOING', isPublished: true },
      ],
    });
    console.log('✅ 4 projets de démo créés');
  }

  console.log('\n🎉 [SEED] Terminé.');
  console.log('   👨‍💼 admin@tower.ma  👨‍🏫 prof@tower.ma  👤 eleve@tower.ma  — mot de passe : password123');
  return enrollment;
}

main()
  .catch((e) => {
    console.error('❌ [SEED] Erreur :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
