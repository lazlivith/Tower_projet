/**
 * Charge les FORMATIONS réelles Tower Structure (fiches pédagogiques complètes).
 *
 *   node prisma/seed-formations.js        (ou : npm run seed:formations)
 *
 * Idempotent : identifiées par leur titre (mises à jour si déjà présentes).
 * Chaque formation crée aussi une classe par défaut (nécessaire pour l'inscription).
 */
import 'dotenv/config';
import pkg from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const { PrismaClient } = pkg;
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const FORMATIONS = [
  {
    title: "Autodesk Revit Structure — Conception BIM & dossier d'exécution",
    description:
      "Maîtriser la méthodologie BIM sous Revit pour modéliser une structure béton armé et métal, générer le ferraillage 3D et produire des plans d'exécution exportables en IFC.",
    price: 6500,
    priceLabel: '6 500 MAD HT / participant (session inter-entreprises) — devis sur mesure en intra',
    level: 'Intermédiaire',
    durationHours: 35,
    format: '35 heures (5 jours) — présentiel à Casablanca ou classe virtuelle synchrone',
    audience:
      "Ingénieurs structure, projeteurs BTP, dessinateurs, techniciens supérieurs de bureau d'études.",
    prerequisites:
      "Connaissances de base en dessin technique et en ingénierie du bâtiment (lecture de plan, éléments de structure).",
    isPublished: true,
    imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1400&q=80',
    objectives: [
      "Maîtriser l'interface et la méthodologie BIM avec Autodesk Revit.",
      'Modéliser une structure complexe en béton armé et métal (fondations, voiles, dalles, poteaux/poutres).',
      "Générer et automatiser le ferraillage 3D conforme aux carnets de détails d'exécution.",
      "Produire des plans de coffrage/ferraillage et exporter au format IFC pour la synthèse inter-lots.",
    ],
    syllabus: [
      { label: 'Jour 1', title: 'Mise en place du projet BIM', points: ['Configuration du projet, niveaux, quadrillages.', 'Modélisation des éléments de structure béton armé.'] },
      { label: 'Jour 2', title: 'Modélisation avancée', points: ['Charpente métallique, assemblages.', 'Création de familles personnalisées.'] },
      { label: 'Jour 3', title: 'Ferraillage 3D', points: ['Ferraillage dans Revit, diamètres et recouvrements.', "Nomenclatures d'armatures."] },
      { label: 'Jour 4', title: 'Livrables d\'exécution', points: ['Annotation, cotation.', "Préparation des feuilles d'exécution et mise en page."] },
      { label: 'Jour 5', title: 'Collaboration & interopérabilité', points: ['Détection de clashs.', 'Exportation IFC et bonnes pratiques de travail collaboratif.'] },
    ],
  },
  {
    title: 'Robot Structural Analysis (RSA) & calcul parasismique (EC8 / RPS 2000)',
    description:
      "Construire des modèles éléments finis 3D sous Robot RSA, appliquer les combinaisons réglementaires, mener une analyse spectrale/modale et produire une note de calcul traçable.",
    price: 7500,
    priceLabel: '7 500 MAD HT / participant',
    level: 'Avancé',
    durationHours: 30,
    format: '30 heures (4 jours) — présentiel ou formule hybride',
    audience: "Ingénieurs d'études structures, ingénieurs conseils, chefs de projets génie civil.",
    prerequisites:
      'Maîtrise de la résistance des matériaux (RDM) et des principes de calcul de structures (Eurocode 2 / EC3).',
    isPublished: true,
    imageUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1400&q=80',
    objectives: [
      'Construire des modèles EF (éléments finis) 3D sous Robot RSA.',
      'Appliquer les combinaisons de charges réglementaires (Eurocode 0/1 et RPS 2000 mod. 2011).',
      'Effectuer une analyse spectrale/modale et optimiser le dimensionnement des voiles et portiques.',
      'Rédiger une note de calcul traçable pour le contrôle technique.',
    ],
    syllabus: [
      { label: 'Jour 1', title: 'Modélisation EF', points: ['Modélisation géométrique 3D, conditions aux limites.', 'Excentricités et maillage éléments finis.'] },
      { label: 'Jour 2', title: 'Chargements & combinaisons', points: ['Charges permanentes, exploitation, vent, neige.', "Combinaisons d'actions."] },
      { label: 'Jour 3', title: 'Calcul parasismique', points: ['Analyse modale, spectre de réponse (EC8 / RPS).', "Vérification du déplacement inter-étage."] },
      { label: 'Jour 4', title: 'Dimensionnement & note de calcul', points: ["Dimensionnement du béton armé, ratios d'acier.", 'Génération automatisée de la note de calcul.'] },
    ],
  },
];

async function upsertFormation(f) {
  const existing = await prisma.course.findFirst({ where: { title: f.title } });
  const data = {
    title: f.title, description: f.description, price: f.price,
    level: f.level, durationHours: f.durationHours, isPublished: f.isPublished,
    imageUrl: f.imageUrl || null,
    audience: f.audience, prerequisites: f.prerequisites, format: f.format,
    priceLabel: f.priceLabel, objectives: f.objectives, syllabus: f.syllabus,
  };
  const course = existing
    ? await prisma.course.update({ where: { id: existing.id }, data })
    : await prisma.course.create({ data });

  const classroom = await prisma.classroom.findFirst({ where: { courseId: course.id } });
  if (!classroom) {
    await prisma.classroom.create({ data: { name: `Session — ${f.title.slice(0, 40)}`, courseId: course.id } });
  }
  return course;
}

async function main() {
  console.log('🎓 Chargement des formations Tower Structure…');
  for (const f of FORMATIONS) {
    await upsertFormation(f);
    console.log(`  • ${f.title}  [${f.durationHours} h · ${f.price} MAD]`);
  }
  console.log(`\n✅ ${FORMATIONS.length} formations chargées.`);
}

main().catch((e) => { console.error('❌', e); process.exit(1); }).finally(() => prisma.$disconnect());
