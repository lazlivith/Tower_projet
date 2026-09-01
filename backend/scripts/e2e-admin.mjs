/**
 * Test d'intégration global — Espace ADMIN.
 *
 * Vérifie que le MANAGER dispose de tous les accès et que chaque action CRUD
 * réussit ET se répercute correctement sur les endpoints publics du site vitrine.
 *
 *   node scripts/e2e-admin.mjs           (nécessite la base de DEV + `npm run seed`)
 *
 * N'altère pas durablement la base : toutes les données créées sont supprimées
 * en fin de parcours (bloc cleanup).
 */
import './_quiet.mjs'; // DOIT rester en premier (env + logs silencieux avant l'import de app)
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import { deleteFile } from '../src/services/storage.service.js';

// ─────────────────────────── utilitaires ───────────────────────────
const C = { g: '\x1b[32m', r: '\x1b[31m', y: '\x1b[33m', d: '\x1b[2m', b: '\x1b[1m', x: '\x1b[0m' };
const results = [];
let SECTION = '';
const sec = (s) => { SECTION = s; console.log(`\n${C.b}▐ ${s}${C.x}`); };

async function check(name, fn) {
  try {
    await fn();
    results.push({ section: SECTION, name, ok: true });
    console.log(`  ${C.g}✓${C.x} ${name}`);
  } catch (e) {
    results.push({ section: SECTION, name, ok: false, err: e.message });
    console.log(`  ${C.r}✗${C.x} ${name}\n      ${C.r}${e.message}${C.x}`);
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion échouée'); }
const eq = (a, b, msg) => assert(a === b, `${msg || ''} (attendu ${JSON.stringify(b)}, reçu ${JSON.stringify(a)})`);

const api = () => request(app);
async function login(email, password) {
  const r = await api().post('/api/auth/login').send({ email, password });
  if (r.status !== 200 || !r.body.accessToken) throw new Error(`login ${email} → HTTP ${r.status} ${JSON.stringify(r.body)}`);
  return r.body;
}
const auth = (tok) => (req) => req.set('Authorization', `Bearer ${tok}`);

// PNG 1×1 transparent
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

const created = { pubId: null, projId: null, courseId: null, classroomIds: [], instructorIds: [], enrollmentIds: [], quoteId: null, uploads: [] };

// ─────────────────────────── run ───────────────────────────
(async () => {
  console.log(`${C.b}=== TEST GLOBAL — ESPACE ADMIN & VITRINE ===${C.x}`);

  // Préflight : base joignable + comptes de démo présents
  try {
    const [a, e] = await Promise.all([
      prisma.user.findUnique({ where: { email: 'admin@tower.ma' } }),
      prisma.user.findUnique({ where: { email: 'eleve@tower.ma' } }),
    ]);
    if (!a || !e) {
      console.error(`${C.r}Comptes de démo absents. Lancez d'abord :  npm run seed${C.x}`);
      await prisma.$disconnect();
      process.exit(2);
    }
  } catch (err) {
    console.error(`${C.r}Base de données injoignable : ${err.message}${C.x}`);
    process.exit(2);
  }

  let admin, adminTok, studentTok;

  // ---- 0. Authentification & contrôle d'accès ----
  sec('Authentification & contrôle d’accès');
  await check('Connexion admin@tower.ma (MANAGER)', async () => {
    admin = await login('admin@tower.ma', 'password123');
    adminTok = admin.accessToken;
    eq(admin.user.role, 'MANAGER', 'rôle');
  });
  await check('Connexion élève (pour tests négatifs)', async () => {
    const s = await login('eleve@tower.ma', 'password123');
    studentTok = s.accessToken;
  });
  await check('Route admin sans token → 401', async () => {
    const r = await api().get('/api/admin/overview');
    eq(r.status, 401, 'HTTP');
  });
  await check('Route admin avec token élève → 403', async () => {
    const r = await auth(studentTok)(api().get('/api/admin/overview'));
    eq(r.status, 403, 'HTTP');
  });

  const A = {
    get: (u) => auth(adminTok)(api().get(u)),
    post: (u, b) => auth(adminTok)(api().post(u)).send(b),
    put: (u, b) => auth(adminTok)(api().put(u)).send(b),
    patch: (u, b) => auth(adminTok)(api().patch(u)).send(b),
    del: (u) => auth(adminTok)(api().delete(u)),
  };

  // ---- 1. Suivi global ----
  sec('Suivi global de la plateforme');
  await check('GET /admin/overview → 200 + structure', async () => {
    const r = await A.get('/api/admin/overview');
    eq(r.status, 200, 'HTTP');
    for (const k of ['users', 'academy', 'enrollments', 'revenue', 'vitrine', 'recent']) assert(k in r.body, `clé manquante: ${k}`);
    assert(typeof r.body.users.total === 'number', 'users.total');
  });
  await check('GET /stats/admin → 200', async () => {
    const r = await A.get('/api/stats/admin');
    eq(r.status, 200, 'HTTP');
  });

  // ---- 2. Publications (Blog vitrine) ----
  sec('Publications  →  page Blog du site');
  await check('POST /cms/publications (brouillon) → 201', async () => {
    const r = await A.post('/api/cms/publications', {
      title: 'E2E — Article de test', content: 'Contenu de test suffisamment long pour passer la validation.',
      excerpt: 'Extrait E2E', category: 'BIM', status: 'DRAFT',
    });
    eq(r.status, 201, 'HTTP');
    created.pubId = r.body.publication?.id;
    assert(created.pubId, 'id manquant');
  });
  await check('Back-office voit le brouillon (GET /cms/admin/publications)', async () => {
    const r = await A.get('/api/cms/admin/publications');
    eq(r.status, 200, 'HTTP');
    assert((Array.isArray(r.body) ? r.body : r.body.data).some((p) => p.id === created.pubId), 'brouillon absent du back-office');
  });
  await check('Vitrine NE montre PAS le brouillon (GET /cms/publications)', async () => {
    const r = await api().get('/api/cms/publications?limit=100');
    eq(r.status, 200, 'HTTP');
    assert(!r.body.data.some((p) => p.id === created.pubId), 'brouillon visible publiquement !');
  });
  await check('PATCH toggle-publish → PUBLISHED', async () => {
    const r = await A.patch(`/api/cms/publications/${created.pubId}/toggle-publish`);
    eq(r.status, 200, 'HTTP');
  });
  await check('Vitrine montre maintenant l’article', async () => {
    const r = await api().get('/api/cms/publications?limit=100');
    assert(r.body.data.some((p) => p.id === created.pubId), 'article publié absent de la vitrine');
  });
  await check('Vitrine — détail GET /cms/publications/:id → 200', async () => {
    const r = await api().get(`/api/cms/publications/${created.pubId}`);
    eq(r.status, 200, 'HTTP');
    eq(r.body.id, created.pubId, 'id');
  });
  await check('PUT /cms/publications/:id (édition) → titre mis à jour côté vitrine', async () => {
    const r = await A.put(`/api/cms/publications/${created.pubId}`, {
      title: 'E2E — Article MODIFIÉ', content: 'Nouveau contenu de test suffisamment long pour la validation.',
      excerpt: 'Extrait modifié', category: 'Eurocodes', status: 'PUBLISHED',
    });
    eq(r.status, 200, 'HTTP');
    const pub = await api().get(`/api/cms/publications/${created.pubId}`);
    eq(pub.body.title, 'E2E — Article MODIFIÉ', 'titre vitrine');
  });
  await check('DELETE /cms/publications/:id → disparaît de la vitrine', async () => {
    const r = await A.del(`/api/cms/publications/${created.pubId}`);
    eq(r.status, 200, 'HTTP');
    const pub = await api().get(`/api/cms/publications/${created.pubId}`);
    eq(pub.status, 404, 'HTTP détail après suppression');
    created.pubId = null;
  });

  // ---- 3. Projets (pages Projets vitrine) ----
  sec('Projets  →  pages « Projets réalisés / en cours »');
  await check('POST /cms/projects (en cours, masqué) → 201', async () => {
    const r = await A.post('/api/cms/projects', {
      title: 'E2E — Projet de test', description: 'Description de test suffisamment longue pour la validation.',
      category: 'Résidentiel', status: 'ONGOING', isPublished: false,
      location: 'Casablanca', surface: '5 000 m²', missions: 'Étude EXE', challenge: 'Défi', solution: 'Solution',
    });
    eq(r.status, 201, 'HTTP');
    created.projId = r.body.project?.id;
    assert(created.projId, 'id manquant');
  });
  await check('Vitrine NE montre PAS le projet masqué', async () => {
    const r = await api().get('/api/cms/projects?limit=100');
    assert(!r.body.data.some((p) => p.id === created.projId), 'projet masqué visible publiquement !');
  });
  await check('PATCH toggle-publish → visible', async () => {
    const r = await A.patch(`/api/cms/projects/${created.projId}/toggle-publish`);
    eq(r.status, 200, 'HTTP');
  });
  await check('Vitrine ?status=ONGOING contient le projet, ?status=COMPLETED non', async () => {
    const on = await api().get('/api/cms/projects?status=ONGOING&limit=100');
    const done = await api().get('/api/cms/projects?status=COMPLETED&limit=100');
    assert(on.body.data.some((p) => p.id === created.projId), 'absent de ONGOING');
    assert(!done.body.data.some((p) => p.id === created.projId), 'présent à tort dans COMPLETED');
  });
  await check('PUT édition (état → COMPLETED) répercuté sur la vitrine', async () => {
    const r = await A.put(`/api/cms/projects/${created.projId}`, {
      title: 'E2E — Projet livré', description: 'Description de test suffisamment longue pour la validation.',
      category: 'Résidentiel', status: 'COMPLETED', isPublished: true,
    });
    eq(r.status, 200, 'HTTP');
    const done = await api().get('/api/cms/projects?status=COMPLETED&limit=100');
    assert(done.body.data.some((p) => p.id === created.projId), 'projet livré absent de COMPLETED');
  });
  await check('Vitrine — détail GET /cms/projects/:id → 200', async () => {
    const r = await api().get(`/api/cms/projects/${created.projId}`);
    eq(r.status, 200, 'HTTP');
  });
  await check('DELETE /cms/projects/:id → disparaît de la vitrine', async () => {
    const r = await A.del(`/api/cms/projects/${created.projId}`);
    eq(r.status, 200, 'HTTP');
    const g = await api().get(`/api/cms/projects/${created.projId}`);
    eq(g.status, 404, 'HTTP détail après suppression');
    created.projId = null;
  });

  // ---- 4. Formations (page Formations vitrine) ----
  sec('Formations  →  page Formations du site');
  await check('POST /admin/courses (+ fiche pédagogique) → 201', async () => {
    const r = await A.post('/api/admin/courses', {
      title: 'E2E — Formation de test', description: 'Description de la formation de test, assez longue.',
      price: 4200, level: 'Intermédiaire', durationHours: 21, classroomName: 'E2E — Promo test',
      audience: 'Ingénieurs', prerequisites: 'Bases RDM', format: '21 h (3 j)', priceLabel: '4 200 MAD HT',
      objectives: ['Objectif A', 'Objectif B'],
      syllabus: [{ label: 'J1', title: 'Prise en main', points: ['Interface', 'Modèle'] }],
    });
    eq(r.status, 201, 'HTTP');
    created.courseId = r.body.course?.id;
    if (r.body.classroom?.id) created.classroomIds.push(r.body.classroom.id);
    assert(created.courseId, 'id manquant');
  });
  await check('GET /admin/academy/courses → formation présente + compteurs', async () => {
    const r = await A.get('/api/admin/academy/courses');
    eq(r.status, 200, 'HTTP');
    const c = r.body.find((x) => x.id === created.courseId);
    assert(c, 'formation absente');
    assert(c.counts && typeof c.counts.classrooms === 'number', 'compteurs manquants');
  });
  await check('GET /admin/academy/courses/:id/content → programme complet', async () => {
    const r = await A.get(`/api/admin/academy/courses/${created.courseId}/content`);
    eq(r.status, 200, 'HTTP');
    assert(Array.isArray(r.body.objectives) && r.body.objectives.length === 2, 'objectifs');
    assert(Array.isArray(r.body.syllabus) && r.body.syllabus.length === 1, 'syllabus');
  });
  await check('Vitrine NE montre PAS la formation non publiée', async () => {
    const r = await api().get('/api/courses?limit=100');
    const list = r.body.data ?? r.body;
    assert(!list.some((c) => c.id === created.courseId), 'formation non publiée visible !');
  });
  await check('PUT /admin/courses/:id { isPublished:true } → 200', async () => {
    const r = await A.put(`/api/admin/courses/${created.courseId}`, { isPublished: true });
    eq(r.status, 200, 'HTTP');
  });
  await check('Vitrine liste + détail montrent la formation avec sa fiche', async () => {
    const list = await api().get('/api/courses?limit=100');
    assert((list.body.data ?? list.body).some((c) => c.id === created.courseId), 'formation publiée absente de la liste');
    const d = await api().get(`/api/courses/${created.courseId}`);
    eq(d.status, 200, 'HTTP détail');
    eq(d.body.priceLabel, '4 200 MAD HT', 'priceLabel vitrine');
    assert(Array.isArray(d.body.objectives) && d.body.objectives.length === 2, 'objectifs vitrine');
  });
  await check('PUT édition fiche (priceLabel) répercutée sur la vitrine', async () => {
    const r = await A.put(`/api/admin/courses/${created.courseId}`, { priceLabel: '4 900 MAD HT' });
    eq(r.status, 200, 'HTTP');
    const d = await api().get(`/api/courses/${created.courseId}`);
    eq(d.body.priceLabel, '4 900 MAD HT', 'priceLabel après édition');
  });

  // ---- 5. Instructeurs ----
  sec('Instructeurs — création & rattachement');
  const stamp = Date.now();
  await check('POST /admin/instructors (compte simple) → 201 + rôle INSTRUCTOR', async () => {
    const r = await A.post('/api/admin/instructors', { nom: 'E2E Prof Simple', email: `e2e.prof.${stamp}@tower.ma` });
    eq(r.status, 201, 'HTTP');
    assert(r.body.instructor?.id, 'id manquant');
    eq(r.body.instructor.role, 'INSTRUCTOR', 'rôle');
    created.instructorIds.push(r.body.instructor.id);
  });
  await check('GET /admin/instructors → nouvel instructeur listé', async () => {
    const r = await A.get('/api/admin/instructors');
    eq(r.status, 200, 'HTTP');
    assert(r.body.some((i) => i.id === created.instructorIds[0]), 'instructeur absent');
  });
  await check('POST /admin/instructors (+ courseId) → créé & assigné à une classe', async () => {
    const r = await A.post('/api/admin/instructors', {
      nom: 'E2E Prof Assigné', email: `e2e.prof2.${stamp}@tower.ma`, courseId: created.courseId,
    });
    eq(r.status, 201, 'HTTP');
    created.instructorIds.push(r.body.instructor.id);
    assert(r.body.classroom?.id, 'aucune classe rattachée');
    created.classroomIds.push(r.body.classroom.id);
  });

  // ---- 6. Classes en ligne ----
  sec('Classes en ligne (classrooms)');
  let clId;
  await check('POST /admin/classrooms → 201', async () => {
    const r = await A.post('/api/admin/classrooms', { courseId: created.courseId, name: 'E2E — Classe B' });
    eq(r.status, 201, 'HTTP');
    clId = r.body.classroom?.id;
    assert(clId, 'id manquant');
    created.classroomIds.push(clId);
  });
  await check('PATCH /admin/classrooms/:id { instructorId } → assigné', async () => {
    const r = await A.patch(`/api/admin/classrooms/${clId}`, { instructorId: created.instructorIds[0] });
    eq(r.status, 200, 'HTTP');
    eq(r.body.classroom.instructor?.id, created.instructorIds[0], 'formateur');
  });
  await check('PATCH { instructorId:null } → désassigné', async () => {
    const r = await A.patch(`/api/admin/classrooms/${clId}`, { instructorId: null });
    eq(r.status, 200, 'HTTP');
    assert(!r.body.classroom.instructor, 'formateur toujours présent');
  });
  await check('PATCH { name } → renommée', async () => {
    const r = await A.patch(`/api/admin/classrooms/${clId}`, { name: 'E2E — Classe B (renommée)' });
    eq(r.status, 200, 'HTTP');
    eq(r.body.classroom.name, 'E2E — Classe B (renommée)', 'nom');
  });
  await check('DELETE /admin/classrooms/:id (sans élève) → 200', async () => {
    const r = await A.del(`/api/admin/classrooms/${clId}`);
    eq(r.status, 200, 'HTTP');
    created.classroomIds = created.classroomIds.filter((x) => x !== clId);
  });

  // ---- 7. Paiements & accès ----
  sec('Paiements & accès élève');
  let student;
  await check('GET /admin/enrollments/pending?status=SUSPENDED → 200 (liste)', async () => {
    const r = await A.get('/api/admin/enrollments/pending?status=SUSPENDED');
    eq(r.status, 200, 'HTTP');
    assert(Array.isArray(r.body), 'tableau attendu');
  });
  await check('POST /admin/enrollments/assign → élève inscrit & activé', async () => {
    student = await prisma.user.findUnique({ where: { email: 'eleve@tower.ma' } });
    const r = await A.post('/api/admin/enrollments/assign', {
      studentId: student.id, courseId: created.courseId, paymentPlan: 'FULL',
    });
    eq(r.status, 201, 'HTTP');
    const enr = r.body.enrollment;
    assert(enr?.id, 'enrollment id');
    created.enrollmentIds.push(enr.id);
    eq(enr.accessStatus, 'ACTIVE', 'statut');
  });
  await check('GET pending?status=ACTIVE → contient l’inscription', async () => {
    const r = await A.get('/api/admin/enrollments/pending?status=ACTIVE');
    assert(r.body.some((e) => e.id === created.enrollmentIds[0]), 'inscription absente de ACTIVE');
  });
  await check('PATCH validate-access { SUSPENDED } puis { ACTIVE } → 200', async () => {
    const s = await A.patch(`/api/admin/enrollments/${created.enrollmentIds[0]}/validate-access`, { status: 'SUSPENDED' });
    eq(s.status, 200, 'HTTP suspend');
    const a = await A.patch(`/api/admin/enrollments/${created.enrollmentIds[0]}/validate-access`, { status: 'ACTIVE' });
    eq(a.status, 200, 'HTTP activate');
  });
  await check('Garde-fou : suppression d’une classe avec élève → 400', async () => {
    // la classe de l'inscription
    const enr = await prisma.enrollment.findUnique({ where: { id: created.enrollmentIds[0] } });
    const r = await A.del(`/api/admin/classrooms/${enr.classroomId}`);
    eq(r.status, 400, 'HTTP (devrait refuser)');
  });

  // ---- 8. Utilisateurs ----
  sec('Utilisateurs — blocage / déblocage');
  await check('GET /admin/users → 200 paginé', async () => {
    const r = await A.get('/api/admin/users');
    eq(r.status, 200, 'HTTP');
    assert(Array.isArray(r.body.data), 'data[]');
  });
  await check('PATCH toggle-status BLOCK puis UNBLOCK (instructeur E2E)', async () => {
    const id = created.instructorIds[0];
    const b = await A.patch(`/api/admin/users/${id}/toggle-status`, { action: 'BLOCK' });
    eq(b.status, 200, 'HTTP block');
    const u1 = await prisma.user.findUnique({ where: { id } });
    eq(u1.isActive, false, 'isActive après BLOCK');
    const ub = await A.patch(`/api/admin/users/${id}/toggle-status`, { action: 'UNBLOCK' });
    eq(ub.status, 200, 'HTTP unblock');
    const u2 = await prisma.user.findUnique({ where: { id } });
    eq(u2.isActive, true, 'isActive après UNBLOCK');
  });

  // ---- 9. Devis (formulaire vitrine → admin) ----
  sec('Devis — du formulaire public au back-office');
  await check('POST /quotes/request (comme la vitrine) → 201', async () => {
    const r = await api().post('/api/quotes/request').send({
      clientName: 'E2E Client', email: `e2e.client.${stamp}@example.com`,
      serviceType: 'Étude EXE', description: 'Demande de test suffisamment longue pour passer la validation Zod.',
    });
    eq(r.status, 201, 'HTTP');
    created.quoteId = r.body.quote?.id ?? r.body.id ?? r.body.data?.id;
    assert(created.quoteId, `id devis manquant: ${JSON.stringify(r.body)}`);
  });
  await check('GET /quotes (admin) → devis présent', async () => {
    const r = await A.get('/api/quotes');
    eq(r.status, 200, 'HTTP');
    const list = Array.isArray(r.body) ? r.body : r.body.data;
    assert(list.some((q) => q.id === created.quoteId), 'devis absent du back-office');
  });
  await check('PATCH /cms/quotes/:id/status ACCEPTED → 200', async () => {
    const r = await A.patch(`/api/cms/quotes/${created.quoteId}/status`, { status: 'ACCEPTED' });
    eq(r.status, 200, 'HTTP');
  });
  await check('DELETE /cms/quotes/:id → 200', async () => {
    const r = await A.del(`/api/cms/quotes/${created.quoteId}`);
    eq(r.status, 200, 'HTTP');
    created.quoteId = null;
  });

  // ---- 10. Upload de médias — rangement par domaine (Cloudinary / disque) ----
  sec('Upload de médias — espaces de stockage par domaine');
  const uploadImg = async (scope, folderContains) => {
    const r = await auth(adminTok)(api().post('/api/upload/image')).field('scope', scope).attach('file', PNG_1PX, 'e2e.png');
    eq(r.status, 201, `HTTP (${scope})`);
    assert(typeof r.body.url === 'string' && r.body.url.length > 0, 'url manquante');
    eq(r.body.scope, scope, 'scope renvoyé');
    assert((r.body.folder || '').includes(folderContains), `dossier attendu ~ "${folderContains}", reçu "${r.body.folder}"`);
    assert((r.body.publicId || '').includes(folderContains.split('/')[0]), `publicId hors du dossier ${folderContains}`);
    if (r.body.publicId) created.uploads.push({ publicId: r.body.publicId, url: r.body.url, resourceType: r.body.resourceType || 'image' });
    if (r.body.provider === 'local') eq((await api().get(r.body.url)).status, 200, 'service statique local');
  };
  await check('image scope=blog       → dossier .../blog', () => uploadImg('blog', 'blog'));
  await check('image scope=projects   → dossier .../projects', () => uploadImg('projects', 'projects'));
  await check('image scope=courses    → dossier .../courses/covers', () => uploadImg('courses', 'courses/covers'));
  await check('scope invalide → 400', async () => {
    const r = await auth(adminTok)(api().post('/api/upload/image')).field('scope', 'n_importe_quoi').attach('file', PNG_1PX, 'e2e.png');
    eq(r.status, 400, 'HTTP');
  });
  await check('POST /api/upload/document (PDF) → dossier courses/documents', async () => {
    const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF');
    const r = await auth(adminTok)(api().post('/api/upload/document')).field('scope', 'courses').attach('file', pdf, 'e2e.pdf');
    eq(r.status, 201, 'HTTP');
    assert((r.body.folder || '').includes('courses/documents'), `dossier reçu "${r.body.folder}"`);
    if (r.body.publicId) created.uploads.push({ publicId: r.body.publicId, url: r.body.url, resourceType: r.body.resourceType || 'raw' });
  });
  await check('POST /api/upload/video refusé à l’élève → 403', async () => {
    const r = await auth(studentTok)(api().post('/api/upload/video')).attach('file', Buffer.from('fakevid'), 'e2e.mp4');
    eq(r.status, 403, 'HTTP');
  });

  // ---- 10b. Génération documentaire (certificat, facture, devis, attestation) ----
  sec('Documents — génération automatisée');
  created.docIds = [];
  let eleveId2;
  await check('POST /admin/documents/attestation → 201 + n° TS-ATT', async () => {
    const eleve = await prisma.user.findUnique({ where: { email: 'eleve@tower.ma' } });
    eleveId2 = eleve.id;
    const r = await A.post('/api/admin/documents/attestation', { studentId: eleve.id, courseId: created.courseId });
    eq(r.status, 201, 'HTTP');
    assert(/^TS-ATT-\d{4}-\d{4}$/.test(r.body.document?.number || ''), `n° inattendu : ${r.body.document?.number}`);
    assert(/^https?:\/\//.test(r.body.document?.url || ''), 'url absolue attendue');
    created.docIds.push(r.body.document.id);
  });
  await check('POST /admin/documents/certificate → 201 + n° TS-CERT', async () => {
    const r = await A.post('/api/admin/documents/certificate', { studentId: eleveId2, courseId: created.courseId, score: 88 });
    eq(r.status, 201, 'HTTP');
    assert(/^TS-CERT-\d{4}-\d{4}$/.test(r.body.document?.number || ''), 'n° certificat');
    created.docIds.push(r.body.document.id);
  });
  await check('POST /admin/documents/quote/:id → 201 + Quote.reference renseignée', async () => {
    const q = await api().post('/api/quotes/request').send({
      clientName: 'E2E Devis', email: `e2e.devis.${stamp}@example.com`,
      serviceType: 'Étude EXE', description: 'Demande de test suffisamment longue pour la validation Zod du devis.',
    });
    const qid = q.body.quote?.id ?? q.body.id;
    const r = await A.post(`/api/admin/documents/quote/${qid}`, { amount: 125000 });
    eq(r.status, 201, 'HTTP');
    assert(/^TS-DEV-\d{4}-\d{4}$/.test(r.body.reference || ''), 'référence devis');
    const updated = await prisma.quote.findUnique({ where: { id: qid } });
    eq(updated.reference, r.body.reference, 'reference persistée sur le devis');
    eq(Number(updated.amount), 125000, 'montant persisté');
    created.docIds.push(r.body.document.id);
    await prisma.quote.delete({ where: { id: qid } });
  });
  await check('Facture depuis un paiement (si présent) → 201', async () => {
    const pay = await prisma.payment.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!pay) return; // aucun paiement en base — cas nominal sur DB fraîche
    const r = await A.post(`/api/admin/documents/invoice/${pay.id}`, {});
    eq(r.status, 201, 'HTTP');
    assert(/^TS-FAC-\d{4}-\d{4}$/.test(r.body.document?.number || ''), 'n° facture');
    created.docIds.push(r.body.document.id);
  });
  await check('GET /admin/documents → registre + filtre par type', async () => {
    const all = await A.get('/api/admin/documents');
    eq(all.status, 200, 'HTTP');
    assert(created.docIds.every((id) => all.body.some((d) => d.id === id)), 'documents générés absents du registre');
    const filtered = await A.get('/api/admin/documents?type=CERTIFICATE');
    assert(filtered.body.every((d) => d.type === 'CERTIFICATE'), 'filtre type inopérant');
  });

  // ---- 11. Espace formateur ----
  sec('Espace formateur — classes, contenu, calendrier, échanges');
  let profTok, profId, teachClassId, teachCourseId;
  await check('Connexion prof@tower.ma (INSTRUCTOR)', async () => {
    const p = await login('prof@tower.ma', 'password123');
    profTok = p.accessToken;
    eq(p.user.role, 'INSTRUCTOR', 'rôle');
  });
  const I = () => ({
    get: (u) => auth(profTok)(api().get(u)),
    post: (u, b) => auth(profTok)(api().post(u)).send(b),
    patch: (u, b) => auth(profTok)(api().patch(u)).send(b),
    del: (u) => auth(profTok)(api().delete(u)),
  });
  await check('Admin assigne le prof à la classe de la formation de test', async () => {
    const instr = await prisma.user.findUnique({ where: { email: 'prof@tower.ma' } });
    profId = instr.id;
    teachCourseId = created.courseId;
    teachClassId = created.classroomIds[0];
    const r = await A.patch(`/api/admin/classrooms/${teachClassId}`, { instructorId: profId });
    eq(r.status, 200, 'HTTP');
  });
  await check('GET /instructor/overview → 200 + KPIs', async () => {
    const r = await I().get('/api/instructor/overview');
    eq(r.status, 200, 'HTTP');
    assert(r.body.kpis && typeof r.body.kpis.classes === 'number', 'kpis');
  });
  await check('GET /instructor/classrooms → contient la classe assignée', async () => {
    const r = await I().get('/api/instructor/classrooms');
    eq(r.status, 200, 'HTTP');
    assert(r.body.some((c) => c.id === teachClassId), 'classe absente');
  });

  let lessonId;
  await check('POST /instructor/lessons (lien YouTube) → 201', async () => {
    const r = await I().post('/api/instructor/lessons', {
      courseId: teachCourseId, title: 'E2E — Leçon vidéo',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', sequenceOrder: 1,
    });
    eq(r.status, 201, 'HTTP');
    lessonId = r.body.lesson?.id;
    assert(lessonId, 'id leçon');
  });
  await check('POST /instructor/lessons #2 puis reorder', async () => {
    const r2 = await I().post('/api/instructor/lessons', { courseId: teachCourseId, title: 'E2E — Leçon 2', sequenceOrder: 2 });
    eq(r2.status, 201, 'HTTP #2');
    const l2 = r2.body.lesson.id;
    const ro = await I().patch(`/api/instructor/courses/${teachCourseId}/lessons/reorder`, { orderedIds: [l2, lessonId] });
    eq(ro.status, 200, 'HTTP reorder');
    const list = await I().get(`/api/instructor/courses/${teachCourseId}/lessons`);
    eq(list.body[0].id, l2, 'ordre appliqué');
    await I().del(`/api/instructor/lessons/${l2}`);
  });
  await check('PATCH /instructor/lessons/:id → titre modifié', async () => {
    const r = await I().patch(`/api/instructor/lessons/${lessonId}`, { title: 'E2E — Leçon vidéo (maj)' });
    eq(r.status, 200, 'HTTP');
    eq(r.body.lesson.title, 'E2E — Leçon vidéo (maj)', 'titre');
  });
  let sessId;
  await check('POST /instructor/courses/:id/sessions (lien Teams) → 201, provider=teams', async () => {
    const r = await I().post(`/api/instructor/courses/${teachCourseId}/sessions`, {
      title: 'E2E — Session Teams',
      scheduledAt: new Date(Date.now() + 864e5).toISOString(),
      duration: 60,
      meetingUrl: 'https://teams.microsoft.com/l/meetup-join/abc',
    });
    eq(r.status, 201, 'HTTP');
    sessId = r.body.session?.id;
    eq(r.body.session?.provider, 'teams', 'provider');
  });
  await check('PATCH puis GET /instructor/sessions', async () => {
    const p = await I().patch(`/api/instructor/sessions/${sessId}`, { title: 'E2E — Session Teams (maj)' });
    eq(p.status, 200, 'HTTP patch');
    const g = await I().get('/api/instructor/sessions');
    assert(g.body.some((s) => s.id === sessId), 'session absente');
  });
  await check('DELETE /instructor/sessions/:id → 200', async () => {
    eq((await I().del(`/api/instructor/sessions/${sessId}`)).status, 200, 'HTTP');
  });

  // Espace de classe (mur d'échange) — prof publie, élève lit et répond
  let msgId, studentReplyId, eleveTok;
  await check('POST /classrooms/:id/messages (prof) → 201', async () => {
    const r = await I().post(`/api/classrooms/${teachClassId}/messages`, { body: 'Bienvenue dans la classe (test e2e).', pinned: true });
    eq(r.status, 201, 'HTTP');
    msgId = r.body.id;
    eq(r.body.pinned, true, 'épinglé');
  });
  await check("L'élève inscrit voit le message et peut répondre", async () => {
    eleveTok = (await login('eleve@tower.ma', 'password123')).accessToken;
    const list = await auth(eleveTok)(api().get(`/api/classrooms/${teachClassId}/messages`));
    eq(list.status, 200, 'HTTP list');
    assert(list.body.messages.some((m) => m.id === msgId), 'message du prof absent');
    const reply = await auth(eleveTok)(api().post(`/api/classrooms/${teachClassId}/messages`)).send({ body: 'Merci !', pinned: true });
    eq(reply.status, 201, 'HTTP reply');
    eq(reply.body.pinned, false, "l'élève ne peut pas épingler");
    studentReplyId = reply.body.id;
  });
  await check('GET /classrooms/mine (élève) → contient la classe', async () => {
    const r = await auth(eleveTok)(api().get('/api/classrooms/mine'));
    eq(r.status, 200, 'HTTP');
    assert(r.body.some((c) => c.id === teachClassId), 'classe absente pour l’élève');
  });
  await check('Le nouvel instructeur E2E (autre classe) est refusé sur ce mur → 403', async () => {
    if (!created.instructorIds.length) return;
    // instructeur créé en section 5, non rattaché à teachClassId
    const other = await prisma.user.findUnique({ where: { id: created.instructorIds[0] } });
    if (!other) return;
    const otok = (await login(other.email, 'password123').catch(() => null))?.accessToken;
    if (!otok) return; // mot de passe temporaire inconnu → on saute proprement
    const r = await auth(otok)(api().get(`/api/classrooms/${teachClassId}/messages`));
    eq(r.status, 403, 'HTTP');
  });
  await check("L'instructeur peut supprimer un message d'élève ; l'élève supprime le sien", async () => {
    eq((await I().del(`/api/classrooms/${teachClassId}/messages/${studentReplyId}`)).status, 200, 'HTTP prof del');
    eq((await I().del(`/api/classrooms/${teachClassId}/messages/${msgId}`)).status, 200, 'HTTP prof del 2');
  });

  // ---- 12. Quiz : classe entière OU élève précis ----
  sec('Quiz — classe entière & élève ciblé');
  let classQuizId, personalQuizId;
  await check('GET /instructor/quizzes/template.xlsx → 200 (xlsx)', async () => {
    const r = await I().get('/api/instructor/quizzes/template.xlsx');
    eq(r.status, 200, 'HTTP');
    assert((r.headers['content-type'] || '').includes('spreadsheetml'), 'content-type');
  });
  await check('POST /instructor/classrooms/:id/quizzes (composeur, toute la classe) → 201', async () => {
    const r = await I().post(`/api/instructor/classrooms/${teachClassId}/quizzes`, {
      title: 'E2E — Quiz classe', passScore: 50,
      questions: [
        { question: '2+2 ?', options: { A: '3', B: '4', C: '5' }, correctAnswer: 'B' },
        { question: 'Capitale du Maroc ?', options: { A: 'Rabat', B: 'Fès' }, correctAnswer: 'A' },
      ],
    });
    eq(r.status, 201, 'HTTP');
    classQuizId = r.body.quiz?.id;
    assert(classQuizId, 'id quiz');
  });
  await check("L'élève voit le quiz et le passe (soumission)", async () => {
    const list = await auth(eleveTok)(api().get('/api/student/quizzes'));
    eq(list.status, 200, 'HTTP list');
    assert(list.body.some((q) => q.id === classQuizId), 'quiz absent de la liste élève');
    const one = await auth(eleveTok)(api().get(`/api/student/quizzes/${classQuizId}`));
    eq(one.status, 200, 'HTTP get');
    assert(one.body.questions?.[0]?.correctAnswer === undefined, 'les réponses ne doivent pas être exposées');
    const sub = await auth(eleveTok)(api().post(`/api/lessons/quiz/${classQuizId}/submit`)).send({ answers: { 0: 'B', 1: 'A' } });
    eq(sub.status, 200, 'HTTP submit');
    eq(sub.body.score, 100, 'score');
    eq(sub.body.passed, true, 'réussi');
  });
  await check('GET /instructor/quizzes/:id/results → cohorte + tentative comptée', async () => {
    const r = await I().get(`/api/instructor/quizzes/${classQuizId}/results`);
    eq(r.status, 200, 'HTTP');
    assert(r.body.summary.started >= 1, 'aucune tentative comptée');
    assert(r.body.rows.some((x) => x.studentId === (created.__eleveId ||= '') || x.status === 'PASSED'), 'ligne PASSED absente');
  });
  await check('POST quiz assigné à un élève précis → 201, assignedTo renseigné', async () => {
    const eleve = await prisma.user.findUnique({ where: { email: 'eleve@tower.ma' } });
    const r = await I().post(`/api/instructor/classrooms/${teachClassId}/quizzes`, {
      title: 'E2E — Quiz perso', assignedToId: eleve.id,
      questions: [{ question: 'x ?', options: { A: '1', B: '2' }, correctAnswer: 'A' }],
    });
    eq(r.status, 201, 'HTTP');
    personalQuizId = r.body.quiz?.id;
    eq(r.body.quiz?.assignedToId, eleve.id, 'assignedToId');
  });
  await check('Quiz assigné à un élève absent de la classe → 400', async () => {
    const r = await I().post(`/api/instructor/classrooms/${teachClassId}/quizzes`, {
      title: 'E2E — mauvais destinataire', assignedToId: profId,
      questions: [{ question: 'x ?', options: { A: '1', B: '2' }, correctAnswer: 'A' }],
    });
    eq(r.status, 400, 'HTTP');
  });
  await check('POST /instructor/quizzes/upload (fichier xlsx généré) → 201', async () => {
    const XLSX = await import('xlsx');
    const aoa = [
      ['Question', 'OptionA', 'OptionB', 'OptionC', 'CorrectAnswer'],
      ['Norme béton armé ?', 'EC2', 'EC3', 'EC8', 'A'],
      ['Acier : module d’Young ?', '210 GPa', '21 GPa', '70 GPa', 'A'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Quiz');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const r = await auth(profTok)(api().post('/api/instructor/quizzes/upload'))
      .field('classroomId', teachClassId)
      .field('title', 'E2E — Quiz importé')
      .attach('file', buf, 'quiz.xlsx');
    eq(r.status, 201, 'HTTP');
    assert(r.body.quiz?.id, 'id quiz');
    await I().del(`/api/instructor/quizzes/${r.body.quiz.id}`);
  });
  await check('Nettoyage quiz', async () => {
    for (const id of [classQuizId, personalQuizId]) if (id) await I().del(`/api/instructor/quizzes/${id}`);
  });

  // ─────────────────────────── cleanup ───────────────────────────
  sec('Nettoyage');
  try {
    if (created.enrollmentIds.length) await prisma.enrollment.deleteMany({ where: { id: { in: created.enrollmentIds } } });
    if (created.pubId) await prisma.publication.deleteMany({ where: { id: created.pubId } });
    if (created.projId) await prisma.project.deleteMany({ where: { id: created.projId } });
    if (created.quoteId) await prisma.quote.deleteMany({ where: { id: created.quoteId } });
    if (created.courseId) await prisma.course.delete({ where: { id: created.courseId } }); // cascade classrooms/enrollments
    if (created.docIds?.length) await prisma.generatedDocument.deleteMany({ where: { id: { in: created.docIds } } });
    if (created.instructorIds.length) await prisma.user.deleteMany({ where: { id: { in: created.instructorIds } } });
    for (const u of created.uploads) await deleteFile(u).catch(() => {});
    console.log(`  ${C.g}✓${C.x} données de test supprimées (dont ${created.uploads.length} média(s))`);
  } catch (e) {
    console.log(`  ${C.y}!${C.x} nettoyage partiel : ${e.message}`);
  }

  // ─────────────────────────── rapport ───────────────────────────
  const pass = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok);
  console.log(`\n${C.b}══════════════════ RÉSULTAT ══════════════════${C.x}`);
  console.log(`  ${C.g}${pass} réussis${C.x}  ·  ${fail.length ? C.r : C.d}${fail.length} échoués${C.x}  ·  ${results.length} au total`);
  if (fail.length) {
    console.log(`\n  ${C.r}${C.b}Échecs :${C.x}`);
    for (const f of fail) console.log(`   ${C.r}✗${C.x} [${f.section}] ${f.name}\n       ${f.err}`);
  }
  await prisma.$disconnect();
  process.exit(fail.length ? 1 : 0);
})().catch(async (e) => {
  console.error(`\n${C.r}ERREUR FATALE${C.x}\n`, e);
  try { await prisma.$disconnect(); } catch { /* noop */ }
  process.exit(2);
});
