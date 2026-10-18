# Audit des endpoints — TowerWeb API (Express v5)

> Mis à jour le 18/10/2026 par relecture intégrale de `src/routes/*.js` (17 fichiers) et de `src/app.js`.
> Remplace l'audit « assainissement W1 » : couvre désormais le CMS (Services inclus), la génération
> de documents, les sessions Jitsi, la messagerie, les notifications, les devis et les quiz.
> Documentation interactive : `GET /api/docs` (Swagger UI) — spec brute : `GET /api/docs/swagger.json`
> (annotée uniquement sur `/api/auth` et une partie de `/api/admin` ; ce fichier est la référence complète).

Légende accès : 🌐 public · 🔒 authentifié (tout rôle, compte actif) · 🎓 STUDENT · 👨‍🏫 INSTRUCTOR · 🛠️ MANAGER
`checkGlobalActivation` = rejette un compte suspendu (`isActive=false`) ; appliqué sur toutes les routes 🔒/🎓/👨‍🏫/🛠️ sauf mention contraire.

## Santé & infrastructure

| Méthode | Chemin | Accès | Notes |
|---|---|---|---|
| GET | `/api/health` | 🌐 | Ping superficiel, pas de dépendance DB — utilisé par le `HEALTHCHECK` Docker et `render.yaml` |
| GET | `/api/health/deep` | 🌐 | Connectivité PostgreSQL, enums, contraintes uniques — diagnostic de déploiement |
| GET | `/api/docs` | 🌐 | Swagger UI |
| GET | `/api/docs/swagger.json` | 🌐 | Spec OpenAPI brute |
| GET | `/uploads/*` | 🌐 | Fichiers statiques (fallback disque local, uniquement si Cloudinary non configuré) |

Rate limiting global `/api` : `RATE_LIMIT_MAX` req / 15 min / IP (défaut 600), **sauf** `/api/payments/webhook` (exclu explicitement). `/api/auth/{register,login,forgot-password}` : 10 / 15 min (limiteur dédié).

## Auth — `/api/auth` (annoté Swagger ✅)

| Méthode | Chemin | Accès | Notes |
|---|---|---|---|
| POST | `/register` | 🌐 | rate-limit `authLimiter` ; rôle STUDENT forcé |
| POST | `/login` | 🌐 | rate-limit ; renvoie `accessToken` + cookie httpOnly `refreshToken` ; 403 `requirePasswordChange` si `isFirstLogin` |
| POST | `/change-initial-password` | 🌐 | flux première connexion (formateur onboardé) |
| POST | `/forgot-password` | 🌐 | rate-limit ; réponse 200 constante (anti-énumération) |
| POST | `/reset-password` | 🌐 | jeton 48 o **haché en BDD** (`password_reset_tokens`), expiration 1 h, usage unique, révoque les refresh tokens |
| POST | `/refresh` | 🌐 (cookie) | rotation du refresh token (haché sha256 en BDD) |
| POST | `/logout` | 🔒 | révoque le refresh token, supprime le cookie |

## Courses — `/api/courses`

| Méthode | Chemin | Accès | Notes |
|---|---|---|---|
| GET | `/` | 🌐 | catalogue vitrine (formations publiées, paginé) |
| GET | `/my-courses` | 🔒 | formations de l'étudiant + taux de progression (avant `/:id`) |
| GET | `/:id` | 🌐 | détail d'une formation |
| GET | `/:id/lessons` | 🔒 | leçons — 403 si `Enrollment` non `ACTIVE` |
| POST | `/:id/progress` | 🔒 | marque une leçon terminée (upsert `Progress`) |

## Sessions live (Jitsi) — `/api/sessions`

| Méthode | Chemin | Accès | Notes |
|---|---|---|---|
| POST | `/schedule` | 👨‍🏫🛠️ | planifie une session Jitsi |
| GET | `/instructor` | 👨‍🏫🛠️ | sessions du formateur |
| GET | `/upcoming` | 🔒 | sessions à venir (côté étudiant) |
| GET | `/:id/join` | 🔒 | URL Jitsi + JWT propre au participant (`JITSI_APP_ID`/`JITSI_APP_SECRET`) |

## Paiements — `/api/payments`

| Méthode | Chemin | Accès | Notes |
|---|---|---|---|
| POST | `/webhook` | 🌐 (Stripe) | corps brut (`express.raw`), vérification de signature `constructEvent`, **exclu du rate-limit et de `express.json`** |
| POST | `/manual-validate/:paymentId` | 🔒 | validation manuelle par un MANAGER (le contrôleur vérifie le rôle) |
| POST | `/checkout` | 🔒 | initie un paiement Stripe Checkout, validé par `checkoutSchema` |
| POST | `/simulate` | 🔒 | **mode test** — inscription + accès actif instantané, sans Stripe |

## CMS vitrine — `/api/cms`

| Méthode | Chemin | Accès | Notes |
|---|---|---|---|
| GET | `/publications` | 🌐 | publications publiées, paginé |
| GET | `/publications/:id` | 🌐 | détail |
| GET | `/projects` | 🌐 | `?status=ONGOING|COMPLETED` |
| GET | `/projects/:id` | 🌐 | détail |
| GET | `/services` | 🌐 | `{ services: [...triés par order...], amo: {...}|null }` — AMO toujours séparé |
| GET | `/services/:slug` | 🌐 | détail d'un service publié |
| GET | `/admin/publications` | 🛠️ | tout le contenu, brouillons inclus |
| GET | `/admin/projects` | 🛠️ | idem |
| GET | `/admin/services` | 🛠️ | idem (services masqués inclus) |
| POST | `/publications` | 🛠️ | `createPublicationSchema` |
| PUT | `/publications/:id` | 🛠️ | idem |
| PATCH | `/publications/:id/toggle-publish` | 🛠️ | bascule DRAFT/PUBLISHED |
| DELETE | `/publications/:id` | 🛠️ | |
| POST | `/projects` | 🛠️ | `createProjectSchema` |
| PUT | `/projects/:id` | 🛠️ | |
| PATCH | `/projects/:id/toggle-publish` | 🛠️ | |
| DELETE | `/projects/:id` | 🛠️ | |
| POST | `/services` | 🛠️ | `createServiceSchema` — slug auto-dérivé du titre si absent |
| PATCH | `/services/reorder` | 🛠️ | `{ ids: string[] }` — **monté avant `/services/:id`** |
| PUT | `/services/:id` | 🛠️ | |
| PATCH | `/services/:id/toggle-publish` | 🛠️ | |
| DELETE | `/services/:id` | 🛠️ | |
| GET | `/quotes` | 🛠️ | liste des devis back-office (alias de `GET /api/quotes`) |
| PATCH | `/quotes/:id/status` | 🛠️ | |
| DELETE | `/quotes/:id` | 🛠️ | |

## Devis — `/api/quotes`

| Méthode | Chemin | Accès | Notes |
|---|---|---|---|
| POST | `/request` | 🌐 | formulaire vitrine. Génère aussitôt le PDF devis (`GeneratedDocument`, référence `TS-DEV-{année}-{0000}`), notifie les MANAGER, envoie un e-mail au client + à `ADMIN_NOTIFY_EMAIL` avec le lien PDF |
| GET | `/` | 🛠️ | liste paginée |
| PATCH | `/:id/status` | 🛠️ | `updateQuoteStatusSchema` (`PENDING\|ACCEPTED\|CONTACTED\|REJECTED`) |

## Documents générés — `/api/documents`

| Méthode | Chemin | Accès | Notes |
|---|---|---|---|
| GET | `/file/:number` | 🌐 | sert les octets du PDF (stocké en base, colonne `content`) — `application/pdf` inline, indépendant de tout CDN |
| GET | `/verify/:number` | 🌐 | authenticité par référence — **aucune donnée personnelle** : `{ valid, number, type, typeLabel, issuedAt }` |

Génération des documents (certificat / facture / devis / attestation) : voir `/api/admin/documents/*` et `/api/quotes/request` ; numérotation idempotente (`backend/src/services/documents/`).

## Téléversements — `/api/upload`

| Méthode | Chemin | Accès | Notes |
|---|---|---|---|
| POST | `/image` | 🔒 | ≤ 5 Mo, MIME `image/*` |
| POST | `/document` | 👨‍🏫🛠️ | ≤ 25 Mo, PDF uniquement |
| POST | `/video` | 👨‍🏫🛠️ | ≤ 300 Mo, MIME `video/*` |

Toutes passent par `storeFile()` — Cloudinary si configuré (`CLOUDINARY_URL`), sinon disque local `uploads/<scope>`.

## Classes — mur de classe — `/api/classrooms`

| Méthode | Chemin | Accès | Notes |
|---|---|---|---|
| GET | `/mine` | 🔒 | classes de l'utilisateur (étudiant inscrit ou formateur assigné) |
| GET | `/:classroomId/messages` | 🔒 | contrôle fin dans le contrôleur (`resolveClassroomAccess` : formateur de la classe OU élève inscrit actif) |
| POST | `/:classroomId/messages` | 🔒 | idem |
| DELETE | `/:classroomId/messages/:messageId` | 🔒 | auteur du message, ou formateur de la classe |

## Messagerie privée — `/api/messages`

| Méthode | Chemin | Accès | Notes |
|---|---|---|---|
| GET | `/` | 🔒 | boîte de réception |
| POST | `/send` | 🔒 | |
| PATCH | `/:messageId/read` | 🔒 | |

## Notifications — `/api/notifications`

| Méthode | Chemin | Accès | Notes |
|---|---|---|---|
| GET | `/` | 🔒 | |
| PATCH | `/mark-all-read` | 🔒 | |
| PATCH | `/:id/read` | 🔒 | |

## Devoirs / rapports — `/api/assignments`

| Méthode | Chemin | Accès | Notes |
|---|---|---|---|
| GET | `/pending` | 👨‍🏫🛠️ | soumissions à corriger |
| PATCH | `/:submissionId/grade` | 👨‍🏫🛠️ | note + statut `GRADED` |
| POST | `/submit` | 🎓 | rendu d'un travail (`fileUrl`) |

## Leçons (vidéo + quiz + présence) — `/api/lessons`

| Méthode | Chemin | Accès | Notes |
|---|---|---|---|
| POST | `/quiz/:id/submit` | 🔒 | soumission d'un quiz (route statique montée avant `/:lessonId/quiz`) |
| GET | `/:lessonId/quiz` | 🔒 | quiz rattaché à une leçon (réponses non exposées) |
| GET | `/:id/video` | 🔒 | résout l'embed vidéo (YouTube ou upload) |
| POST | `/:id/track` | 🔒 | suivi du temps passé — alimente `Enrollment.hoursSpent`, condition du certificat |

## Espace étudiant — `/api/student` (🎓)

| Méthode | Chemin | Notes |
|---|---|---|
| GET | `/dashboard` | tableau de bord agrégé (leçons, sessions live, formateur) |
| GET | `/certificates` | délivrance auto si éligible : `hoursSpent ≥ 85 h` (seuil fixe, `CERT_MIN_HOURS`, indépendant de la durée affichée de la formation) **+** tous les quiz de la classe validés |
| GET | `/quizzes` | quiz assignés (classe entière ou individuel) |
| GET | `/quizzes/:id` | détail d'un quiz assigné |
| GET | `/documents` | documents personnels (`GeneratedDocument` + `Certificate` hérités) |
| GET | `/reports` | travaux rendus + statut de correction |
| PATCH | `/lessons/:lessonId/toggle` | `checkActiveEnrollmentForLesson` — marque une leçon complétée |

## Espace formateur — `/api/instructor` (👨‍🏫🛠️)

| Méthode | Chemin | Notes |
|---|---|---|
| GET | `/overview` | synthèse (KPIs) |
| GET | `/my-courses` | formations assignées |
| GET | `/classrooms` | classes du formateur |
| POST | `/classrooms` | créer une classe (`createClassroomSchema`) |
| PATCH | `/move-student` | déplacer un élève d'une classe à l'autre |
| GET | `/courses/:courseId/students` | étudiants d'une classe + progression |
| GET | `/courses/:courseId/lessons` | contenu d'un cours |
| POST | `/lessons` | ajouter une leçon (vidéo YouTube/upload + PDF), `addLessonSchema` |
| PATCH | `/lessons/:lessonId` | modifier |
| DELETE | `/lessons/:lessonId` | supprimer |
| PATCH | `/courses/:courseId/lessons/reorder` | réordonner |
| GET | `/sessions` | sessions planifiées par le formateur |
| POST | `/courses/:courseId/sessions` | planifier une session live |
| PATCH | `/sessions/:sessionId` | modifier |
| DELETE | `/sessions/:sessionId` | supprimer |
| GET | `/quizzes/template.xlsx` | modèle de quiz à télécharger |
| POST | `/quizzes/upload` | import quiz par fichier `.xlsx`/`.csv` (≤ 2 Mo) — `parseQuizWorkbook`, 2 à 6 options |
| POST | `/classrooms/:classroomId/quizzes` | créer un quiz via le composeur (JSON, classe entière ou élève ciblé) |
| GET | `/classrooms/:classroomId/quizzes` | quiz d'une classe |
| GET | `/quizzes/:id/results` | résultats agrégés |
| DELETE | `/quizzes/:id` | |

## Back-office admin — `/api/admin` (🛠️, Swagger partiel)

| Méthode | Chemin | Notes |
|---|---|---|
| GET | `/users` | liste paginée + statut de règlement |
| PATCH | `/users/:userId/toggle-status` | bloquer / débloquer |
| PATCH | `/enrollments/:enrollmentId/status` | forcer `ACTIVE`/`SUSPENDED` |
| POST | `/enrollments/assign` | inscrire un élève dans une classe |
| GET | `/enrollments/pending` | en attente de validation de paiement |
| PATCH | `/enrollments/:enrollmentId/validate-access` | validation manuelle d'accès (paiement simulé) |
| POST | `/courses` | créer formation + classe principale (transaction), `createCourseSchema` |
| PUT | `/courses/:courseId` | mettre à jour, `updateCourseSchema` |
| PATCH | `/courses/:courseId/assign-instructor` | (ré)assigner un formateur |
| POST | `/certificates/validate` | génération manuelle de certificat |
| POST | `/instructors/onboard` | création + assignation transactionnelle + e-mail d'identifiants, `onboardInstructorSchema` |
| GET | `/overview` | suivi global (compteurs, entonnoir, activité récente) |
| GET | `/academy/courses` | formations (classes + formateurs + contenu) |
| GET | `/academy/courses/:courseId/content` | détail du contenu |
| GET | `/instructors` | liste des formateurs |
| POST | `/instructors` | création simple (assignation optionnelle), `createInstructorSchema` |
| POST | `/classrooms` | créer une classe en ligne, `createClassroomSchema` |
| PATCH | `/classrooms/:classroomId` | modifier, `updateClassroomSchema` |
| DELETE | `/classrooms/:classroomId` | supprimer |
| GET | `/documents` | registre des documents générés (`?type=&q=`) |
| POST | `/documents/attestation` | génère une attestation d'inscription manuellement |
| POST | `/documents/certificate` | génère un certificat manuellement |
| POST | `/documents/quote/:quoteId` | (re)génère le PDF d'un devis, fixe `Quote.reference` |
| POST | `/documents/invoice/:paymentId` | (re)génère la facture d'un paiement |

## Statistiques — `/api/stats`

| Méthode | Chemin | Accès | Notes |
|---|---|---|---|
| GET | `/admin` | 🛠️ | KPIs globaux |
| GET | `/instructor` | 👨‍🏫🛠️ | KPIs formateur |
| GET | `/student` | 🎓 | KPIs étudiant |

## Récapitulatif

17 groupes de routes applicatives + santé/documentation, **130 endpoints** (compte exact : `grep -rhoE "router\.(get|post|put|patch|delete)\(" src/routes/*.js | wc -l` = 125, + 4 routes santé/Swagger + `/uploads/*`). Sécurité générale (CORS, rate limiting, RBAC, validation Zod `.strict()`) détaillée dans `SECURITY.md`.
