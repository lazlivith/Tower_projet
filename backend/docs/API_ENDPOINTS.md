# Audit des endpoints — TowerWeb API (Express v5)

> Généré lors de l'assainissement W1. Source de vérité : `src/routes/*.js`.
> Documentation interactive : `GET /api/docs` (Swagger UI) — spec brute : `GET /api/docs/swagger.json`.

Légende accès : 🌐 public · 🔒 authentifié · 🎓 STUDENT · 👨‍🏫 INSTRUCTOR · 🛠️ MANAGER

## Auth — `/api/auth` (annoté Swagger ✅)

| Méthode | Chemin | Accès | Notes |
|---|---|---|---|
| POST | `/register` | 🌐 | rate-limit `authLimiter` (10 / 15 min), rôle STUDENT forcé |
| POST | `/login` | 🌐 | rate-limit ; renvoie `accessToken` + cookie httpOnly `refreshToken` ; 403 `requirePasswordChange` si `isFirstLogin` |
| POST | `/change-initial-password` | 🌐 | flux première connexion |
| POST | `/forgot-password` | 🌐 | rate-limit ; réponse 200 constante (anti-énumération) |
| POST | `/reset-password` | 🌐 | token en mémoire (⚠️ à migrer en BDD — W7) |
| POST | `/refresh` | 🌐 (cookie) | rotation du refresh token. **Le front doit appeler `/auth/refresh`** (corrigé W1) |
| POST | `/logout` | 🔒 | révoque le refresh token |

## Courses — `/api/courses`

| Méthode | Chemin | Accès | Notes |
|---|---|---|---|
| GET | `/` | 🌐 | catalogue vitrine (formations publiées, paginé) |
| GET | `/my-courses` | 🔒 | formations de l'étudiant + taux de progression |
| GET | `/:id` | 🌐 | détail d'une formation |
| GET | `/:id/lessons` | 🔒 | leçons — 403 si `Enrollment` non `ACTIVE` |
| POST | `/:id/progress` | 🔒 | marque une leçon terminée (upsert `Progress`) |

## Student — `/api/student` (🎓)

| Méthode | Chemin | Notes |
|---|---|---|
| GET | `/dashboard` | tableau de bord agrégé (leçons, live sessions, instructeur) |
| PATCH | `/lessons/:lessonId/toggle` | + `checkActiveEnrollmentForLesson` |

## Instructor — `/api/instructor` (👨‍🏫 / 🛠️)

| Méthode | Chemin | Notes |
|---|---|---|
| GET | `/my-courses` | cours assignés + stats |
| POST | `/classrooms` | créer une classe |
| POST | `/lessons` | ajouter une leçon à un cours assigné |
| PATCH | `/move-student` | déplacer un étudiant de classe |
| GET | `/courses/:courseId/students` | étudiants d'une classe + progression |
| POST | `/courses/:courseId/sessions` | planifier une session live |

## Admin — `/api/admin` (🛠️, annoté Swagger partiel)

| Méthode | Chemin | Notes |
|---|---|---|
| GET | `/users` | liste paginée + statut règlement |
| PATCH | `/users/:userId/toggle-status` | bloquer / débloquer |
| PATCH | `/enrollments/:enrollmentId/status` | forcer `ACTIVE` / `SUSPENDED` |
| POST | `/enrollments/assign` | inscrire un étudiant dans une classe |
| POST | `/courses` | **créer formation + classe** (transaction — ajouté W1) |
| PUT | `/courses/:courseId` | mettre à jour une formation (ajouté W1) |
| POST | `/certificates/validate` | générer un certificat PDF (manuel — auto en W6) |
| POST | `/instructors/onboard` | onboarding instructeur transactionnel + email |
| PATCH | `/courses/:courseId/assign-instructor` | (ré)assigner un instructeur |
| GET | `/enrollments/pending` | inscriptions en attente |
| PATCH | `/enrollments/:enrollmentId/validate-access` | activer l'accès |

## Payments — `/api/payments`

| Méthode | Chemin | Accès | Notes |
|---|---|---|---|
| POST | `/webhook` | 🌐 (signé Stripe) | `checkout.session.completed` — ⚠️ `invoice.payment_succeeded` à ajouter (W4) |
| POST | `/manual-validate/:paymentId` | 🔒 (🛠️ attendu) | validation manuelle + email accès |
| POST | `/checkout` | 🔒 | crée la session Stripe Checkout (validé Zod) |
| POST | `/simulate` | 🔒 | helper test — ⚠️ bug `paymentPlan` à corriger (W4) |

## Quotes — `/api/quotes`

| Méthode | Chemin | Accès | Notes |
|---|---|---|---|
| POST | `/request` | 🌐 | demande de devis (vitrine) — front à connecter (W3) |
| GET | `/` | 🛠️ | liste paginée |
| PATCH | `/:id/status` | 🛠️ | changer le statut |

## CMS — `/api/cms` (contenu vitrine géré par l'admin)

| Méthode | Chemin | Accès | Notes |
|---|---|---|---|
| GET | `/publications` · `/projects` | 🌐 | contenu publié |
| POST/PUT/PATCH/DELETE | `/publications/*` · `/projects/*` | 🛠️ | CRUD + toggle visibilité |
| GET/PATCH/DELETE | `/quotes*` | 🛠️ | ⚠️ doublon avec `/api/quotes` — à rationaliser (W3) |

## Sessions — `/api/sessions`

| Méthode | Chemin | Accès |
|---|---|---|
| POST | `/schedule` | 👨‍🏫 / 🛠️ |
| GET | `/instructor` | 👨‍🏫 / 🛠️ |
| GET | `/upcoming` | 🔒 (étudiant) |

> ⚠️ Génération d'URL Jitsi dupliquée entre `session.controller` et `instructor.controller`, sans JWT — à unifier en W6.

## Autres

| Base | Endpoints | Accès |
|---|---|---|
| `/api/assignments` | `GET /pending`, `PATCH /:submissionId/grade`, `POST /submit` | 👨‍🏫/🛠️ · 🎓 |
| `/api/notifications` | `GET /`, `PATCH /mark-all-read`, `PATCH /:id/read` | 🔒 |
| `/api/messages` | `GET /`, `POST /send`, `PATCH /:messageId/read` | 🔒 |
| `/api/stats` | `GET /admin` · `/instructor` · `/student` | 🛠️ · 👨‍🏫 · 🎓 |
| `/api/upload` | `POST /image` (🔒) · `POST /document`, `POST /video` (👨‍🏫/🛠️) — Cloudinary si configuré, sinon disque local | 🔒 |
| `/api/health`, `/api/health/deep` | diagnostic | 🌐 |

## Reste à faire (documentation)

- [ ] Annoter au format `@swagger` les routes hors `auth` (script d'inventaire ci-dessus comme référence).
- [ ] Rationaliser le doublon devis `/api/quotes` vs `/api/cms/quotes`.
- [ ] Documenter les schémas de réponse (`components.schemas`) pour `User`, `Course`, `Enrollment`, `Payment`.
