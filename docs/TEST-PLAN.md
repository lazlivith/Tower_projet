# Plan de test — TowerWeb

## Pré-requis

```bash
# 1. Base + seed
cd backend
npx prisma migrate deploy
npm run seed
npm run dev            # http://localhost:5000  (Swagger : /api/docs)

# 2. Front
cd ../frontend
npm run dev            # http://localhost:5173
```

### Test d'intégration automatisé — Espace admin ⇄ Vitrine

```bash
cd backend
npm run test:e2e      # = node scripts/e2e-admin.mjs   (base de DEV + npm run seed requis)
```

50 vérifications : accès/CRUD MANAGER sur publications, projets, formations,
instructeurs, classes en ligne, paiements/accès, utilisateurs, devis, uploads
(Cloudinary ou disque) — et à chaque fois la répercussion sur les endpoints
publics du site vitrine. Toutes les données créées sont supprimées en fin de run.
Sortie : `50 réussis · 0 échoués` + code de sortie 0/1.

Optionnel :
- **Emails réels** : renseigner `SMTP_*` dans `backend/.env` (sinon les mails sont affichés dans la console).
- **Cloudinary** : `CLOUDINARY_URL` (ou trio `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET`) dans `backend/.env` — sinon fallback disque local `backend/uploads/`.
- **Stripe réel** : `STRIPE_SECRET_KEY` (test) + `stripe listen --forward-to localhost:5000/api/payments/webhook` puis coller le `whsec_...` dans `STRIPE_WEBHOOK_SECRET`. Sans Stripe, utiliser le bouton **« Confirmer en mode test »**.

## Comptes de test (seed)

| Rôle | Email | Mot de passe | Accès |
|---|---|---|---|
| Manager / SuperAdmin | `admin@tower.ma` | `password123` | Cockpit `/learn/admin` |
| Instructeur | `prof@tower.ma` | `password123` | `/learn/instructor` — assigné à la classe « Promotion Démo » |
| Étudiant | `eleve@tower.ma` | `password123` | `/learn/student` — inscrit ACTIF à « Introduction au BIM & Eurocodes » |
| Public | — | — | Vitrine `/` |

**Données seed :**
- Formation *Introduction au BIM & Eurocodes* (1500 DH, publiée) — classe *Promotion Démo* (instructeur : prof) — 4 chapitres :
  - Ch.1 : vidéo YouTube — *déverrouillé*
  - Ch.2 : vidéo YouTube **+ Quiz** (3 questions, seuil 70 %) — *verrouillé tant que Ch.1 non terminé*
  - Ch.3 / Ch.4 : sans vidéo ni quiz
- Formation *Calcul des Structures en Béton Armé* (2200 DH, publiée) — sans chapitre
- **Réponses du quiz seed** : Q1 → **A**, Q2 → **B**, Q3 → **C**

---

## 1. Vitrine publique (aucune connexion)

| # | Scénario | Étapes | Résultat attendu |
|---|---|---|---|
| V1 | Navigation | Ouvrir `/` → parcourir Accueil, À Propos, Services, Formations | Contenu statique s'affiche, header collant, menu Services déroulant |
| V2 | Catalogue formations | `/formations` | Les 2 formations publiées remontent depuis `GET /api/courses` (titre, niveau, durée, prix) |
| V3 | **Demande de devis** | `/quote` → remplir Nom, Email, Service, Type de projet, Description (> 20 car.) → *Envoyer* | Message « Demande envoyée ! », redirection accueil après 3 s. En base : ligne `Quote` créée (visible côté admin). Email d'accusé (console si pas de SMTP) |
| V4 | Devis — validation | Envoyer avec description < 20 caractères | Message d'erreur « Merci de détailler votre projet… », pas d'envoi |
| V5 | Bridge (non connecté) | Bouton « Accès Tower-Learn » | Redirige vers `/learn/login` |
| V6 | Bridge (connecté) | Se connecter, revenir sur `/` | Le header affiche le nom + un lien vers le dashboard du rôle |

---

## 2. Espace Étudiant — `eleve@tower.ma`

| # | Scénario | Étapes | Résultat attendu |
|---|---|---|---|
| E1 | Connexion | `/learn/login` → identifiants étudiant | Redirection `/learn/student`, tableau de bord avec la formation BIM |
| E2 | **Menu utilisateur** | Icône profil (haut droite) → ouvrir le dropdown | Entrées : Profil, Notes, Calendrier, Fichiers personnels, Rapports, Préférences, **Langue** (sous-menu FR/EN/AR), Déconnexion |
| E3 | Langue | Menu → Langue → العربية | `<html dir="rtl">`, choix persisté (localStorage) au rechargement |
| E4 | Profil | Menu → Profil | Nom, email, rôle, statut du compte + lien « Changer mon mot de passe » |
| E5 | **Déblocage séquentiel** | Ouvrir la formation → déplier Ch.2 | Ch.2 affiche un **cadenas** + « Non disponible à moins que l'activité précédente soit marquée comme achevée ». Ch.3/4 verrouillés aussi |
| E6 | **Lecteur vidéo intégré** | Déplier Ch.1 → lancer la vidéo | Vidéo YouTube jouée **en iFrame dans la page** (pas de redirection). Barre « Visionné à X % » qui progresse |
| E7 | Auto-complétion vidéo | Laisser la vidéo dépasser ~90 % (ou avancer la lecture) | Ch.1 passe à « terminé » automatiquement, **Ch.2 se déverrouille** |
| E8 | Complétion manuelle | Terminer Ch.1, déplier Ch.3 (sans vidéo/quiz) → *Marquer ce chapitre comme terminé* | Ch.3 terminé, Ch.4 déverrouillé. Le bouton n'apparaît PAS sur les chapitres avec vidéo ou quiz |
| E9 | **Quiz interactif** | Ch.2 déverrouillé → dérouler le quiz → répondre A / B / C → *Valider mes réponses* | Score **100 %**, « Quiz réussi — chapitre validé ✅ », Ch.2 marqué terminé |
| E10 | Quiz échoué | Refaire le quiz avec de mauvaises réponses | Score < 70 %, « Quiz non validé — réessayez », bouton *Recommencer* |
| E11 | Barre de progression | Après E7–E9 | Le % de progression global de la formation augmente sur la bannière |
| E12 | Certificat — en cours | Menu latéral → Certificats | Carte « En cours d'obtention » : jauge *Présence X / 85 h*, *Quiz validés n / 1* |
| E13 | Certificat — obtenu | Voir la note « Test du certificat » ci-dessous, puis recharger la page Certificats | Carte certificat + **bouton « Télécharger le PDF »** → PDF avec nom, formation, note, **heures effectuées**, date |
| E14 | Visio Jitsi | (après qu'un instructeur a planifié une session — scénario I5) → dashboard → *Rejoindre la visio* | Page `/learn/session/:id` : **salle Jitsi en iFrame**. Badge « JWT » si `JITSI_APP_SECRET` configuré |
| E15 | Cloisonnement | Se déconnecter, tenter d'ouvrir `/learn/admin` | Redirection (rôle insuffisant) |

> **Test du certificat (E13)** — atteindre 85 h de présence n'est pas réaliste à la main. Au choix :
> - abaisser temporairement `CERT_MIN_HOURS` dans `backend/src/services/certificate.service.js` (ex. `1`), refaire E7 + E9, recharger Certificats ;
> - ou en base : `UPDATE enrollments SET hours_spent = 90 WHERE ...;` puis valider le quiz (E9) et recharger ;
> - ou côté admin : `POST /api/admin/certificates/validate` (génération forcée).

---

## 3. Espace Instructeur — `prof@tower.ma`

| # | Scénario | Étapes | Résultat attendu |
|---|---|---|---|
| I1 | Connexion | `/learn/login` → identifiants prof | Redirection `/learn/instructor` |
| I2 | **Import Quiz Excel** | Menu latéral → *Quiz (Excel)* → sélectionner la classe *Promotion Démo* → chapitre *Ch.3* (optionnel) → choisir un fichier `.xlsx` | Voir I3 pour le fichier |
| I3 | Fichier valide | Colonnes `Question, OptionA, OptionB, OptionC, OptionD, CorrectAnswer` (valeurs A–D), 2–3 lignes → *Importer* | « Quiz importé : N question(s) », **prévisualisation** des questions (bonne réponse surlignée), quiz listé sous la classe |
| I4 | Fichier invalide | Retirer la colonne `OptionD`, ou mettre `CorrectAnswer = Z` sur la ligne 2 → *Importer* | Erreur **400** détaillée : « Colonnes manquantes : OptionD » ou « Ligne 3 : CorrectAnswer doit être A, B, C ou D » |
| I5 | Planifier une visio | Tableau de bord instructeur → planifier une session (titre + date/heure) pour la formation BIM | Session créée, URL Jitsi générée (salle unique). Les étudiants actifs reçoivent une notification |
| I6 | Rejoindre sa visio | Session active → *Rejoindre la classe en direct* | `/learn/session/:id` — iFrame Jitsi, badge **« Modérateur »** |
| I7 | Suivi étudiants | Voir ses classes / étudiants (endpoint `GET /api/instructor/classrooms`) | La classe *Promotion Démo* avec l'effectif et le nombre de quiz |
| I8 | Cloisonnement | Tenter `POST /api/instructor/quizzes/upload` avec un `classroomId` d'une classe non assignée | **403** « Vous n'êtes pas assigné à cette classe » |

**Exemple de contenu `quiz-test.xlsx` :**

| Question | OptionA | OptionB | OptionC | OptionD | CorrectAnswer |
|---|---|---|---|---|---|
| Capitale du Maroc ? | Rabat | Casablanca | Fès | Tanger | A |
| 2 + 2 = ? | 3 | 4 | 5 | 22 | B |
| Norme béton armé ? | EN 1990 | EN 1992 | EN 1993 | EN 1998 | B |

---

## 4. Espace SuperAdmin / Manager — `admin@tower.ma`

| # | Scénario | Étapes | Résultat attendu |
|---|---|---|---|
| A1 | Connexion | `/learn/login` → identifiants admin | Redirection `/learn/admin` (cockpit) |
| A2 | **Onboarding instructeur** | Utilisateurs → *Créer un Instructeur* → Nom, Email (nouveau), Formation assignée → *Créer* | Transaction : compte `INSTRUCTOR` créé + assigné à une classe. **Email** avec mot de passe temporaire **+ lien de connexion** (console si pas de SMTP). `isFirstLogin = true` |
| A3 | Onboarding — email en échec | Configurer un `SMTP_*` invalide, refaire A2 | **Rollback** : réponse 5xx, **aucun** instructeur créé en base |
| A4 | Onboarding — doublon | Refaire A2 avec un email déjà utilisé | **400** « Un utilisateur avec cet email existe déjà » |
| A5 | **Première connexion forcée** | Se déconnecter → se connecter avec l'instructeur créé en A2 (mot de passe temporaire) | Redirection `/learn/first-login` — impossible d'accéder au dashboard tant que le mot de passe n'est pas changé |
| A6 | Changement de mot de passe | Saisir nouveau mot de passe (≥ 6 car.) ×2 → valider | Succès, retour login, connexion OK avec le nouveau mot de passe |
| A7 | **Créer une formation** | Formations → nouveau : Titre, Description, Prix, Niveau (Débutant/Interm./Avancé), Nom de classe (optionnel) → *Créer* | Formation **+ classe principale** créées en transaction. Visible dans le catalogue vitrine si publiée |
| A8 | Assigner un instructeur | Formations → *Assigner un instructeur* sur une formation | Toutes les classes de la formation reçoivent l'instructeur |
| A9 | Bloquer / débloquer | Utilisateurs → *Bloquer* l'étudiant | L'étudiant bloqué : `403` « compte suspendu » à la prochaine requête. *Débloquer* rétablit l'accès |
| A10 | **Suivi des devis** | Devis → liste | La demande créée en V3 apparaît (client, service, statut PENDING). Changer le statut (CONTACTED / ACCEPTED / REJECTED) |
| A11 | Suivi financier | Paiements | Liste des paiements ; validation manuelle d'un paiement en attente → accès étudiant activé + email |
| A12 | CMS vitrine | Publications / Projets → créer une entrée | Créée via `/api/cms/*`, visible sur la vitrine si publiée |
| A13 | Cloisonnement | Tenter `/learn/instructor/quizzes` | Accessible en lecture (MANAGER hérite), mais un `STUDENT` est redirigé |

---

## 5. Parcours complet E2E (bout en bout)

1. **Public** : `/formations` → *Calcul des Structures en Béton Armé* → *S'inscrire* → login/inscription.
2. **Paiement** : page `/payment/:courseId` → choisir **Comptant** ou **Échéancier 3×**.
   - *Voie Stripe* : *Payer par carte* → Checkout Stripe → carte test `4242 4242 4242 4242`, date future, CVC quelconque → retour `/payment/success`. Le webhook passe l'inscription `SUSPENDED → ACTIVE` (3× : 2 échéances `PENDING` créées).
   - *Voie mode test* : *Confirmer en mode test* → accès activé immédiatement.
3. **Réception d'accès** : email de confirmation (console) + notification in-app.
4. **E-Learning** : `/learn/student` → la nouvelle formation apparaît → suivre les chapitres (déblocage séquentiel).
5. **Quiz** : valider le quiz d'un chapitre → chapitre marqué achevé automatiquement.
6. **Certificat** : une fois `hoursSpent ≥ 85` (cf. note E13) **et** tous les quiz validés → certificat généré, **téléchargement PDF** depuis *Mes Certificats*.

---

## 6. Sécurité (rapide)

| # | Test | Attendu |
|---|---|---|
| S1 | 15+ tentatives de login échouées en < 15 min | `429` « Trop de tentatives » (rate-limit auth) |
| S2 | Requête API sans `Authorization` sur une route protégée | `401` |
| S3 | `POST /api/payments/checkout` avec `courseId` non-UUID | `400` (validation Zod) |
| S4 | En-têtes de réponse | Présence des en-têtes `helmet` (X-Content-Type-Options, etc.) |
| S5 | Mot de passe oublié | `/api/auth/forgot-password` → jeton **haché** en table `password_reset_tokens`, lien valable 1 h, usage unique |
