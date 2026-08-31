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
    title: 'Le BIM, socle de la maîtrise structurelle',
    category: 'BIM',
    excerpt: "Pourquoi la maquette numérique est aujourd'hui indissociable d'une étude de structure fiable.",
    imageUrl: '',
    status: 'PUBLISHED',
    content:
      "Le Building Information Modeling (BIM) dépasse largement la simple représentation 3D. " +
      "Pour l'ingénierie structurelle, il constitue une base de données unique et coordonnée : géométrie, " +
      "matériaux, charges, phasage de construction.\n\n" +
      "Chez Tower Structure, chaque projet est modélisé en BIM dès la phase d'esquisse. Cela permet de " +
      "détecter les incohérences entre lots (structure, fluides, architecture) avant le chantier, de fiabiliser " +
      "les métrés et de produire des notes de calcul traçables.\n\n" +
      "Les gains constatés : réduction des reprises d'étude, meilleure anticipation des délais, et un dossier " +
      "d'exécution directement exploitable par l'entreprise.",
  },
  {
    title: 'Eurocodes : les points de vigilance en zone sismique',
    category: 'Eurocodes',
    excerpt: "EN 1998 (Eurocode 8) — check-list des paramètres qui conditionnent le dimensionnement.",
    imageUrl: '',
    status: 'PUBLISHED',
    content:
      "Le dimensionnement parasismique selon l'Eurocode 8 repose sur quelques choix structurants effectués " +
      "très tôt dans le projet :\n\n" +
      "• Classe de sol et zone sismique — ils fixent le spectre de réponse.\n" +
      "• Coefficient de comportement (q) — lié au système de contreventement et à la ductilité visée.\n" +
      "• Régularité en plan et en élévation — une irrégularité impose une analyse modale spectrale complète.\n" +
      "• Dispositions constructives (chaînages, confinement des nœuds) — souvent sous-estimées en phase APS.\n\n" +
      "Un pré-dimensionnement rigoureux sur ces points évite des reprises lourdes en phase PRO.",
  },
  {
    title: 'Diagnostic structurel : 5 signaux à ne jamais ignorer',
    category: 'Diagnostic',
    excerpt: 'Fissures, flèches, corrosion, tassements, vibrations — comment prioriser une intervention.',
    imageUrl: '',
    status: 'PUBLISHED',
    content:
      "Un diagnostic structurel commence par une inspection visuelle méthodique. Cinq familles de désordres " +
      "doivent déclencher une investigation approfondie :\n\n" +
      "1. Fissures évolutives ou traversantes, surtout à 45° ou au droit des appuis.\n" +
      "2. Flèches visibles de planchers ou de poutres au-delà des tolérances (L/250 à L/500 selon usage).\n" +
      "3. Corrosion des armatures avec éclatement du béton d'enrobage.\n" +
      "4. Tassements différentiels — portes qui coincent, décollements de cloisons.\n" +
      "5. Vibrations perceptibles sous usage normal (planchers de bureaux, passerelles).\n\n" +
      "Tower Structure établit un rapport hiérarchisé (urgence, cause probable, solution de confortement).",
  },
  {
    title: 'Renforcement de structures existantes : quelles techniques ?',
    category: 'Diagnostic',
    excerpt: 'Chemisage béton, lamelles composites, précontrainte additionnelle — critères de choix.',
    imageUrl: '',
    status: 'DRAFT',
    content:
      "Le confortement d'un ouvrage existant se choisit selon la nature du déficit (flexion, effort tranchant, " +
      "poinçonnement), les contraintes d'exploitation et le budget.\n\n" +
      "• Chemisage béton armé : robuste, augmente l'inertie, mais réduit les gabarits et impose un arrêt d'usage.\n" +
      "• Lamelles / tissus composites (PRFC) : mise en œuvre rapide, faible surépaisseur, adaptée à la flexion.\n" +
      "• Précontrainte additionnelle extérieure : efficace pour reprendre des flèches et rouvrir des marges.\n\n" +
      "Article en cours de rédaction — sera complété par des retours de chantier.",
  },
];

// ─────────────────────────────────────────────────────────────
// PROJETS
// status : 'COMPLETED' (réalisés) ou 'ONGOING' (en cours)
// category : texte libre (Résidentiel, Commercial, Infrastructure, Industriel, Santé, …)
// ─────────────────────────────────────────────────────────────
const PROJETS = [
  {
    title: 'Résidence Al Andalous — Rabat',
    category: 'Résidentiel',
    status: 'COMPLETED',
    isPublished: true,
    imageUrl: '',
    description:
      "Immeuble R+8 en béton armé, 42 logements. Étude complète de structure, note de calcul Eurocode 2 et 8, " +
      "plans de coffrage et de ferraillage, assistance à la consultation des entreprises.",
  },
  {
    title: 'Centre commercial Marina — Casablanca',
    category: 'Commercial',
    status: 'COMPLETED',
    isPublished: true,
    imageUrl: '',
    description:
      "Charpente métallique de grande portée (18 m) sur 12 000 m² de plancher, mezzanines mixtes acier-béton, " +
      "étude de stabilité au feu et modélisation BIM complète.",
  },
  {
    title: 'Plateforme logistique — Zone franche de Tanger',
    category: 'Industriel',
    status: 'COMPLETED',
    isPublished: true,
    imageUrl: '',
    description:
      "Bâtiment industriel 8 000 m², structure poteaux-poutres préfabriqués, dallage industriel armé fibres, " +
      "fondations sur pieux compte tenu du sol compressible.",
  },
  {
    title: "Pont sur l'Oued Bouregreg",
    category: 'Infrastructure',
    status: 'ONGOING',
    isPublished: true,
    imageUrl: '',
    description:
      "Assistance technique au maître d'ouvrage et contrôle d'exécution d'un ouvrage d'art en béton précontraint. " +
      "Chantier en cours — suivi des phases de bétonnage et de mise en tension.",
  },
  {
    title: 'Confortement parasismique — Hôpital régional',
    category: 'Santé',
    status: 'ONGOING',
    isPublished: true,
    imageUrl: '',
    description:
      "Renforcement d'un bâtiment hospitalier des années 1980 : voiles de contreventement additionnels, " +
      "chemisage de poteaux, reprise des nœuds poteau-poutre. Travaux réalisés en site occupé, par tranches.",
  },
  {
    title: 'Tour tertiaire Casa Finance City',
    category: 'Commercial',
    status: 'ONGOING',
    isPublished: true,
    imageUrl: '',
    description:
      "Immeuble de bureaux R+15, noyau béton et planchers post-tendus. Étude de structure, analyse dynamique " +
      "au vent et au séisme, coordination BIM avec les lots techniques.",
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
