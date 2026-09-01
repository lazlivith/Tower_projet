/**
 * Charge le CONTENU VITRINE (publications + projets) — Tower Structure.
 *
 *   node prisma/seed-content.js
 *
 * Idempotent : chaque entrée est identifiée par son titre (mise à jour si déjà présente).
 * ➜ Édite les tableaux PUBLICATIONS et PROJETS ci-dessous avec les vraies données de l'entreprise,
 *   puis relance la commande. Les images peuvent être des URLs (https://…) ou des chemins
 *   /uploads/images/… uploadés via l'espace admin.
 */
import 'dotenv/config';
import pkg from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const { PrismaClient } = pkg;
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// ─────────────────────────────────────────────────────────────
// BLOG / PUBLICATIONS
// status : 'PUBLISHED' (visible sur /blog) ou 'DRAFT'
// ─────────────────────────────────────────────────────────────
const PUBLICATIONS = [
  {
    title: "Comment optimiser le dimensionnement d'un voile en béton armé selon l'Eurocode 2 ?",
    category: 'Technique',
    excerpt: "Élancement, chaînages, taux d'armatures minimal : la méthode pour un voile juste dimensionné, ni sur- ni sous-armé.",
    imageUrl: '',
    status: 'PUBLISHED',
    content:
      "Le voile en béton armé est un élément à la fois porteur (charges verticales) et de contreventement " +
      "(efforts horizontaux, séisme). Un mauvais dimensionnement se traduit soit par un surcoût d'acier, soit " +
      "par un défaut de résistance ou de ductilité.\n\n" +
      "1. Vérifier l'élancement — la longueur de flambement conditionne la prise en compte des effets du second ordre (EN 1992-1-1, §5.8).\n\n" +
      "2. Distinguer voile courant et voile de grande hauteur — la répartition des contraintes et le ferraillage minimal diffèrent.\n\n" +
      "3. Respecter les taux d'armatures minimaux et maximaux (verticales et horizontales) et les dispositions de chaînage aux extrémités.\n\n" +
      "4. En zone sismique, appliquer les prescriptions de l'Eurocode 8 : zones critiques, confinement des about de voile, vérification de l'effort tranchant majoré.\n\n" +
      "Notre pratique : un modèle éléments finis sous Robot RSA pour la descente de charges réelle, puis une vérification manuelle des sections critiques. Résultat : un ratio d'acier maîtrisé et une note de calcul lisible par le bureau de contrôle.",
  },
  {
    title: 'Les 5 erreurs à éviter lors du passage de Robot RSA à Revit Structure',
    category: 'BIM & Innovation',
    excerpt: "Unités, axes, relâchements, familles, mapping des sections : l'interopérabilité RSA ↔ Revit sans mauvaise surprise.",
    imageUrl: '',
    status: 'PUBLISHED',
    content:
      "L'aller-retour entre l'outil de calcul (Robot Structural Analysis) et la maquette (Revit Structure) fait " +
      "gagner un temps considérable — à condition d'éviter quelques pièges classiques.\n\n" +
      "1. Systèmes d'unités et de coordonnées non alignés — recaler l'origine et le nord de projet avant tout export.\n\n" +
      "2. Relâchements et conditions d'appui perdus au transfert — les revérifier systématiquement côté RSA après import.\n\n" +
      "3. Familles Revit non structurelles utilisées comme éléments porteurs — le calcul les ignore ou les interprète mal.\n\n" +
      "4. Mapping des sections et matériaux incomplet — créer une bibliothèque de correspondances maintenue projet après projet.\n\n" +
      "5. Modifier la géométrie des deux côtés en parallèle — définir un sens de synchronisation unique (le modèle analytique fait foi).\n\n" +
      "Ces points sont traités en pratique dans notre formation Revit Structure (jour 5, interopérabilité).",
  },
  {
    title: 'Gestion des pathologies du béton : causes, diagnostics et solutions de renforcement',
    category: 'Chantier',
    excerpt: 'Carbonatation, chlorures, alcali-réaction : identifier le mécanisme avant de choisir le confortement.',
    imageUrl: '',
    status: 'PUBLISHED',
    content:
      "Avant de renforcer, il faut comprendre. Les pathologies du béton armé relèvent le plus souvent de trois " +
      "mécanismes.\n\n" +
      "• Corrosion par carbonatation — le front de carbonatation atteint les armatures, l'acier gonfle, le béton " +
      "d'enrobage éclate. Fréquent sur ouvrages anciens peu enrobés.\n\n" +
      "• Corrosion par les chlorures — milieux marins ou sels de déverglaçage ; corrosion localisée (piqûres), plus " +
      "insidieuse car peu visible en surface.\n\n" +
      "• Réactions internes (alcali-réaction, ettringite différée) — faïençage, gonflement, perte de cohésion.\n\n" +
      "Le diagnostic combine relevé visuel, mesures (enrobage, potentiel de corrosion, carottages) et calcul de la " +
      "capacité portante résiduelle.\n\n" +
      "Solutions de confortement selon le cas : passivation et réparation locale, protection cathodique, " +
      "chemisage béton, lamelles ou tissus carbone (PRFC), ajout de profilés acier. Chaque solution fait l'objet " +
      "d'une note de calcul et d'un chiffrage.",
  },
];

// ─────────────────────────────────────────────────────────────
// PROJETS
// status : 'COMPLETED' (réalisés) ou 'ONGOING' (en cours)
// category : texte libre (Résidentiel, Commercial, Infrastructure, Industriel, Santé, …)
// ─────────────────────────────────────────────────────────────
const PROJETS = [
  {
    title: 'Résidence tertiaire R+10 — Casablanca',
    category: 'Résidentiel & tertiaire',
    status: 'COMPLETED',
    isPublished: true,
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1400&q=80',
    location: 'Casablanca',
    surface: '12 000 m²',
    description:
      "Immeuble mixte R+10 avec sous-sol. Étude de structure béton armé (EXE) et coordination BIM au niveau LOD 350.",
    missions:
      "Étude de structure béton armé (dossier d'exécution) et coordination BIM (LOD 350) avec les lots architecture et MEP.",
    challenge:
      "Sous-sol en nappe phréatique et portées libres de 9 mètres au rez-de-chaussée, imposant des retombées de poutres incompatibles avec les hauteurs sous plafond.",
    solution:
      "Conception d'un radier général étanche et d'un plancher dalle alvéolaire pour supprimer les retombées de poutres. Une ré-analyse fine sous Robot RSA a permis une économie de 12 % sur le ratio d'acier.",
  },
  {
    title: 'Halle industrielle en charpente métallique',
    category: 'Ouvrages industriels',
    status: 'COMPLETED',
    isPublished: true,
    imageUrl: 'https://images.unsplash.com/photo-1587613864521-9ef8dfe617cc?auto=format&fit=crop&w=1400&q=80',
    location: 'Zone industrielle',
    surface: '6 500 m²',
    description:
      "Halle de production à grande portée en charpente métallique. Conception, dimensionnement EC3 et plans d'assemblage.",
    missions: "Conception de la charpente métallique, dimensionnement Eurocode 3, plans d'assemblage.",
    challenge: 'Portée libre de 24 m sans poteau intermédiaire, pont roulant en toiture et contreventement en zone sismique.',
    solution: 'Fermes treillis à âme triangulée, palées de stabilité optimisées et assemblages boulonnés préfabriqués pour un montage rapide.',
  },
  {
    title: 'Réhabilitation & extension — surélévation de 2 niveaux',
    category: 'Réhabilitation & extension',
    status: 'COMPLETED',
    isPublished: true,
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1400&q=80',
    location: 'Centre-ville',
    surface: '2 800 m²',
    description:
      "Renforcement d'une structure existante en béton armé avec ajout de deux niveaux, sans interruption d'usage.",
    missions: "Diagnostic structural, calcul de capacité portante résiduelle, ingénierie de confortement et étude de la surélévation.",
    challenge: "Fondations et poteaux existants sous-dimensionnés pour deux niveaux supplémentaires ; travaux en site occupé.",
    solution: 'Chemisage béton des poteaux du RDC, reprise en sous-œuvre des semelles et ossature métallique légère pour les niveaux ajoutés.',
  },
  {
    title: 'Complexes immobiliers — synthèse BIM & calcul parasismique',
    category: 'Résidentiel & tertiaire',
    status: 'ONGOING',
    isPublished: true,
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80',
    location: 'Grand Casablanca',
    surface: '—',
    description:
      "Deux ensembles immobiliers en phase DCE/EXE : synthèse BIM inter-lots et calculs parasismiques (EC8 / RPS 2000).",
    missions: 'Synthèse BIM inter-lots, calculs parasismiques et production des dossiers EXE en phase DCE.',
    challenge: 'Coordination multi-bâtiments avec des trames structurelles hétérogènes et un planning EXE tendu.',
    solution: 'Maquette fédérée mise à jour hebdomadairement, matrice de clashs partagée et note de calcul par bâtiment.',
  },
];

async function upsertPublication(p) {
  const existing = await prisma.publication.findFirst({ where: { title: p.title } });
  const data = {
    title: p.title,
    excerpt: p.excerpt || null,
    category: p.category || null,
    content: p.content,
    imageUrl: p.imageUrl || null,
    status: p.status || 'DRAFT',
  };
  return existing
    ? prisma.publication.update({ where: { id: existing.id }, data })
    : prisma.publication.create({ data });
}

async function upsertProject(p) {
  const existing = await prisma.project.findFirst({ where: { title: p.title } });
  const data = {
    title: p.title,
    description: p.description,
    category: p.category,
    imageUrl: p.imageUrl || null,
    status: p.status || 'COMPLETED',
    isPublished: p.isPublished ?? true,
    location: p.location || null,
    surface: p.surface || null,
    missions: p.missions || null,
    challenge: p.challenge || null,
    solution: p.solution || null,
  };
  return existing
    ? prisma.project.update({ where: { id: existing.id }, data })
    : prisma.project.create({ data });
}

async function main() {
  console.log('📰 Chargement du contenu vitrine Tower Structure…');
  for (const p of PUBLICATIONS) {
    await upsertPublication(p);
    console.log(`  • publication : ${p.title} [${p.status}]`);
  }
  for (const p of PROJETS) {
    await upsertProject(p);
    console.log(`  • projet      : ${p.title} [${p.status}]`);
  }
  console.log(`\n✅ ${PUBLICATIONS.length} publications + ${PROJETS.length} projets chargés.`);
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
