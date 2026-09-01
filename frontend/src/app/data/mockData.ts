// Services data — contenu réel Tower Structure (statique, structuré)
export interface ServiceSheet {
  id: string;
  title: string;
  description: string;      // résumé court (liste Services + Accueil)
  image: string;
  details: {
    objective: string;       // « Objectif : … »
    scope: string[];         // Périmètre d'action
    deliverables: string[];  // Livrables techniques
  };
}

export const services: ServiceSheet[] = [
  {
    id: 'exe',
    title: "Études d'exécution (EXE) & calculs de structure",
    description:
      "Conception et dimensionnement en béton armé, charpente métallique et bois. Notes de calcul et plans d'exécution optimisés.",
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    details: {
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
  },
  {
    id: 'bim',
    title: 'Coordination BIM & synthèse technique inter-lots',
    description:
      "Maquettes numériques structurelles (LOD 100 à 400), détection de clashs et synthèse avec les lots architecture et MEP.",
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
    details: {
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
  },
  {
    id: 'diagnostic',
    title: 'Diagnostic structural & audit de réhabilitation',
    description:
      "Audit d'ouvrages existants, calcul de capacité portante résiduelle et ingénierie de confortement.",
    image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=80',
    details: {
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
  },
];

/** Assistance à la maîtrise d'ouvrage — présentée en encart sur la page Services. */
export const amoService = {
  title: "Assistance à la maîtrise d'ouvrage (AMO) & suivi de chantier",
  points: [
    'Vérification de la conformité des travaux de structure sur le terrain.',
    'Conseil et optimisation technico-financière des projets de construction.',
  ],
};

// Projects gallery
export const projects = [
  {
    id: '1',
    title: 'Tour Résidentielle - Paris 15e',
    category: 'Résidentiel',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop',
    description: 'Modélisation BIM et calculs structurels',
  },
  {
    id: '2',
    title: 'Pont Autoroutier A6',
    category: 'Infrastructure',
    image: 'https://images.unsplash.com/photo-1587653915936-5623ea0b949a?w=800&h=600&fit=crop',
    description: 'Diagnostic et renforcement',
  },
  {
    id: '3',
    title: 'Centre Commercial Lyon',
    category: 'Commercial',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop',
    description: 'Coordination BIM multidisciplinaire',
  },
  {
    id: '4',
    title: 'Hôpital Universitaire',
    category: 'Santé',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop',
    description: 'Étude sismique Eurocode 8',
  },
];

// Formations (Courses)
export const formations = [
  {
    id: 'bim-fundamentals',
    title: 'BIM - Les Fondamentaux',
    description: 'Maîtrisez les concepts de base du Building Information Modeling',
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&h=600&fit=crop',
    instructor: 'Prof. Martin',
    duration: '40 heures',
    level: 'Débutant',
    modules: 12,
    students: 156,
  },
  {
    id: 'eurocodes-advanced',
    title: 'Eurocodes - Niveau Avancé',
    description: 'Approfondissement des calculs selon les normes européennes',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop',
    instructor: 'Dr. Rousseau',
    duration: '60 heures',
    level: 'Avancé',
    modules: 18,
    students: 89,
  },
  {
    id: 'structural-analysis',
    title: 'Analyse Structurelle',
    description: 'Méthodes modernes d\'analyse des structures',
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop',
    instructor: 'Ing. Dubois',
    duration: '50 heures',
    level: 'Intermédiaire',
    modules: 15,
    students: 124,
  },
  {
    id: 'seismic-design',
    title: 'Conception Parasismique',
    description: 'Principes et pratiques de la conception parasismique',
    image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=600&fit=crop',
    instructor: 'Prof. Martin',
    duration: '45 heures',
    level: 'Avancé',
    modules: 14,
    students: 67,
  },
];

// Student progress data
export const studentProgress = [
  { courseId: 'bim-fundamentals', courseName: 'BIM - Les Fondamentaux', progress: 60, lastAccessed: '2026-05-08', grade: 85 },
  { courseId: 'eurocodes-advanced', courseName: 'Eurocodes - Niveau Avancé', progress: 80, lastAccessed: '2026-05-09', grade: 92 },
  { courseId: 'structural-analysis', courseName: 'Analyse Structurelle', progress: 35, lastAccessed: '2026-05-05', grade: 78 },
];

// Student notifications
export const studentNotifications = [
  { id: '1', type: 'assignment', message: 'Nouveau devoir disponible - BIM Fondamentaux Module 7', time: '2h', read: false },
  { id: '2', type: 'grade', message: 'Note publiée - Quiz Eurocodes: 92/100', time: '5h', read: false },
  { id: '3', type: 'announcement', message: 'Session live: Modélisation avancée - 15 Mai 14h', time: '1j', read: true },
  { id: '4', type: 'certificate', message: 'Certificat disponible - Module 1 complété', time: '2j', read: true },
];

// Student certificates
export const studentCertificates = [
  { id: '1', course: 'BIM - Les Fondamentaux', module: 'Module 1: Introduction', date: '2026-04-15', score: 95 },
  { id: '2', course: 'Eurocodes - Niveau Avancé', module: 'Module 1: Bases', date: '2026-04-20', score: 88 },
];

// Student upcoming sessions
export const upcomingSessions = [
  { id: '1', title: 'Modélisation 3D Avancée', instructor: 'Prof. Martin', date: '2026-05-15', time: '14:00', duration: '2h' },
  { id: '2', title: 'Calculs Sismiques', instructor: 'Dr. Rousseau', date: '2026-05-18', time: '10:00', duration: '1.5h' },
  { id: '3', title: 'Q&A BIM', instructor: 'Prof. Martin', date: '2026-05-20', time: '16:00', duration: '1h' },
];

// Admin statistics
export const adminStats = {
  totalUsers: 245,
  activeStudents: 189,
  instructors: 8,
  totalCourses: 12,
  pendingQuotes: 15,
  monthlyRevenue: 45800,
  completionRate: 78,
  satisfaction: 4.6,
};

// Instructor assigned courses
export const instructorCourses = [
  {
    id: 'bim-fundamentals',
    title: 'BIM - Les Fondamentaux',
    students: 156,
    completionRate: 65,
    avgScore: 82,
  },
  {
    id: 'seismic-design',
    title: 'Conception Parasismique',
    students: 67,
    completionRate: 58,
    avgScore: 78,
  },
];

// Instructor pending assignments
export const pendingAssignments = [
  { id: '1', student: 'Marie Dupont', course: 'BIM - Les Fondamentaux', assignment: 'Projet Modélisation', submittedDate: '2026-05-09', status: 'pending' },
  { id: '2', student: 'Pierre Martin', course: 'BIM - Les Fondamentaux', assignment: 'Quiz Module 5', submittedDate: '2026-05-10', status: 'pending' },
  { id: '3', student: 'Sophie Bernard', course: 'Conception Parasismique', assignment: 'Étude de cas', submittedDate: '2026-05-08', status: 'pending' },
];

// Instructor messages
export const instructorMessages = [
  { id: '1', student: 'Jean Leblanc', subject: 'Question sur le Module 3', preview: 'Bonjour, je ne comprends pas la partie sur...', date: '2026-05-10', read: false },
  { id: '2', student: 'Marie Dupont', subject: 'Délai pour le projet', preview: 'Serait-il possible d\'avoir une extension...', date: '2026-05-09', read: false },
  { id: '3', student: 'Luc Petit', subject: 'Merci pour le cours', preview: 'Excellent cours, très instructif...', date: '2026-05-08', read: true },
];

// Pending quotes for admin
export const pendingQuotes = [
  {
    id: '1',
    clientName: 'Entreprise Martin',
    email: 'contact@martin-construction.fr',
    service: 'BIM & Modélisation 3D',
    projectType: 'Résidentiel',
    budget: '50000-100000',
    description: 'Immeuble de 8 étages',
    date: '2026-05-09',
    status: 'pending',
  },
  {
    id: '2',
    clientName: 'Société Dupuis',
    email: 'info@dupuis.fr',
    service: 'Diagnostic Structurel',
    projectType: 'Infrastructure',
    budget: '20000-50000',
    description: 'Pont en béton armé',
    date: '2026-05-08',
    status: 'pending',
  },
  {
    id: '3',
    clientName: 'SARL Bertrand',
    email: 'bertrand@example.com',
    service: 'Calculs Eurocodes',
    projectType: 'Commercial',
    budget: '10000-20000',
    description: 'Centre commercial extension',
    date: '2026-05-07',
    status: 'pending',
  },
];

// Recent activities for admin dashboard
export const recentActivities = [
  { id: '1', type: 'quote', message: 'Nouveau devis reçu - Entreprise Martin', time: '5 min' },
  { id: '2', type: 'user', message: 'Nouvel utilisateur inscrit - Marie Laurent', time: '2 h' },
  { id: '3', type: 'course', message: 'Formation "BIM Avancé" complétée - Jean Dupont', time: '5 h' },
  { id: '4', type: 'quote', message: 'Devis accepté - Société Dupuis', time: '1 jour' },
];

// Blog posts / Publications
export const blogPosts = [
  {
    id: '1',
    title: 'Les Nouvelles Normes BIM 2026',
    slug: 'nouvelles-normes-bim-2026',
    excerpt: 'Découvrez les évolutions majeures des standards BIM pour cette année',
    content: 'Contenu complet de l\'article...',
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&h=600&fit=crop',
    author: 'Dr. Sophie Rousseau',
    category: 'BIM',
    publishedDate: '2026-05-01',
    status: 'published',
    views: 1245,
  },
  {
    id: '2',
    title: 'Calcul Parasismique: Guide Pratique',
    slug: 'calcul-parasismique-guide',
    excerpt: 'Un guide complet pour maîtriser les calculs selon l\'Eurocode 8',
    content: 'Contenu complet de l\'article...',
    image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=600&fit=crop',
    author: 'Prof. Marc Martin',
    category: 'Eurocodes',
    publishedDate: '2026-04-28',
    status: 'published',
    views: 892,
  },
  {
    id: '3',
    title: 'Innovation dans le Diagnostic Structurel',
    slug: 'innovation-diagnostic',
    excerpt: 'Les technologies émergentes qui révolutionnent l\'inspection des structures',
    content: 'Contenu complet de l\'article...',
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop',
    author: 'Ing. Paul Dubois',
    category: 'Diagnostic',
    publishedDate: '2026-04-25',
    status: 'published',
    views: 654,
  },
  {
    id: '4',
    title: 'Formation continue: Pourquoi c\'est essentiel',
    slug: 'formation-continue-essentiel',
    excerpt: 'L\'importance de la formation continue dans le génie civil moderne',
    content: 'Contenu complet de l\'article...',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop',
    author: 'Dr. Sophie Rousseau',
    category: 'Formation',
    publishedDate: '2026-05-08',
    status: 'draft',
    views: 0,
  },
];

// Analytics data for admin
export const analyticsData = {
  websiteVisits: {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai'],
    data: [1200, 1900, 1500, 2100, 2400],
  },
  enrollments: {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai'],
    data: [15, 23, 18, 29, 34],
  },
  revenue: {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai'],
    data: [35000, 42000, 38000, 48000, 45800],
  },
  topCourses: [
    { name: 'BIM - Les Fondamentaux', students: 156, revenue: 18720 },
    { name: 'Analyse Structurelle', students: 124, revenue: 14880 },
    { name: 'Eurocodes - Avancé', students: 89, revenue: 10680 },
  ],
};
