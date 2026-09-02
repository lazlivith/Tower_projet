import prisma from '../src/config/prisma.js';

/**
 * Seed des services vitrine — reprend le contenu figé de `frontend/.../data/mockData.ts`
 * (services[] + amoService). Idempotent : upsert par slug.
 *   npm run seed:services
 */

const SERVICES = [
  {
    slug: 'exe',
    kind: 'SERVICE',
    order: 1,
    title: "Études d'exécution (EXE) & calculs de structure",
    summary:
      "Conception et dimensionnement en béton armé, charpente métallique et bois. Notes de calcul et plans d'exécution optimisés.",
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    objective:
      "Transformer le concept architectural en une structure sûre, pérenne et optimisée en coût de construction.",
    scope: [
      'Descente de charges et dimensionnement des fondations (superficielles, profondes / pieux).',
      'Calculs de structures en béton armé (EC2), charpente métallique (EC3) et mixte.',
      "Étude parasismique avancée selon l'Eurocode 8 et le règlement parasismique national (RPS 2000).",
      "Optimisation des métrés et des notes de calcul pour les dossiers d'exécution (EXE).",
    ],
    deliverables: [
      'Notes de calcul exhaustives, conformes aux exigences des bureaux de contrôle.',
      'Plans de coffrage et plans de ferraillage détaillés pour le chantier.',
    ],
  },
  {
    slug: 'bim',
    kind: 'SERVICE',
    order: 2,
    title: 'Coordination BIM & synthèse technique inter-lots',
    summary:
      "Maquettes numériques structurelles (LOD 100 à 400), détection de clashs et synthèse avec les lots architecture et MEP.",
    imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
    objective:
      'Éliminer les erreurs de conception avant le démarrage du chantier pour éviter les surcoûts et les retards.',
    scope: [
      'Modélisation de maquettes numériques structurelles (niveau de détail LOD 100 à 400).',
      "Détection d'interférences (clash detection) entre la structure, l'architecture et les réseaux (MEP).",
      'Réunions de synthèse et gestion des réserves avec tous les intervenants du projet.',
    ],
    deliverables: [
      'Rapports de synthèse et matrice de clashs.',
      'Fichiers natifs RVT et livrables universels IFC.',
    ],
  },
  {
    slug: 'diagnostic',
    kind: 'SERVICE',
    order: 3,
    title: 'Diagnostic structural & audit de réhabilitation',
    summary:
      "Audit d'ouvrages existants, calcul de capacité portante résiduelle et ingénierie de confortement.",
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=80',
    objective:
      "Évaluer l'état de santé d'un bâtiment existant et définir des solutions de confortement.",
    scope: [
      'Relevé de désordres (fissures, corrosion des armatures, flèches excessives).',
      "Calcul de la capacité portante résiduelle avant surélévation ou changement d'usage.",
      'Ingénierie de confortement (lamelles carbone, résines, chemisage béton, profilés acier).',
    ],
    deliverables: [
      "Rapport d'audit structural détaillé avec préconisations de travaux chiffrées.",
    ],
  },
  {
    slug: 'amo',
    kind: 'AMO',
    order: 10,
    title: "Assistance à la maîtrise d'ouvrage (AMO) & suivi de chantier",
    summary: "Vérification de la conformité des travaux de structure et optimisation technico-financière.",
    imageUrl: null,
    objective: null,
    scope: [
      'Vérification de la conformité des travaux de structure sur le terrain.',
      'Conseil et optimisation technico-financière des projets de construction.',
    ],
    deliverables: [],
  },
];

async function main() {
  for (const s of SERVICES) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: {
        kind: s.kind, order: s.order, title: s.title, summary: s.summary,
        imageUrl: s.imageUrl, objective: s.objective, scope: s.scope, deliverables: s.deliverables,
      },
      create: s,
    });
    console.log(`  ✓ ${s.slug} (${s.kind})`);
  }
  console.log('Services vitrine seedés.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
