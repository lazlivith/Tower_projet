# Sécurité — TowerWeb API (état W7)

## Mesures en place

| Domaine | Implémentation |
|---|---|
| En-têtes HTTP | `helmet` (CSP désactivée : Swagger UI via CDN, front servi séparément) |
| CORS | Liste blanche d'origines (`FRONTEND_URL`, séparées par des virgules), `credentials: true` |
| Rate limiting | Global `/api` : 600 req / 15 min / IP (`RATE_LIMIT_MAX`). Auth (`/register`, `/login`, `/forgot-password`) : 10 / 15 min. Webhook Stripe exclu |
| Taille des requêtes | `express.json`/`urlencoded` limités à 1 Mo |
| Proxy | `app.set('trust proxy', 1)` — IP réelle derrière Render/Railway/Nginx |
| Sessions | Access token JWT 15 min + refresh token opaque **haché (sha256)** en BDD, cookie `httpOnly` + `secure` (prod) + `sameSite`, rotation à chaque refresh |
| Mot de passe oublié | Jeton aléatoire 48 o **haché en BDD** (`password_reset_tokens`), expiration 1 h, usage unique (`usedAt`), révocation des refresh tokens après reset, purge quotidienne (cron) |
| Webhook Stripe | Corps brut (`express.raw`) + vérification de signature `constructEvent` |
| Validation | Zod (`.strict()`) sur toutes les entrées sensibles |
| Upload | `multer` — images 5 Mo, PDF 20 Mo, tableurs 2 Mo (mémoire), filtres MIME |
| RBAC | `restrictToRole([...])` + `checkGlobalActivation` (compte suspendu) + vérification d'inscription `ACTIVE` par ressource |

## Vulnérabilités résiduelles connues (npm audit)

| Paquet | Sévérité | Statut |
|---|---|---|
| `xlsx` (SheetJS) | high | **Pas de correctif sur le registre npm.** Mitigation officielle : installer depuis le CDN SheetJS — `npm i https://cdn.sheetjs.com/xlsx-latest/xlsx-latest.tgz`. À faire au déploiement (W8). Surface limitée : fichiers `.xlsx` uploadés uniquement par des instructeurs authentifiés, parsés en mémoire, jamais ré-émis. |
| `deepmerge-ts` < 8 | high | Transitif via `prisma` CLI (**devDependency**, jamais exécuté en production). Pas d'entrée utilisateur. |

## À renforcer ultérieurement

- Verrouillage progressif / captcha après N échecs de login par compte (au-delà du rate-limit IP).
- Rotation de `JWT_SECRET` + `kid`.
- Journalisation des accès sensibles (onboarding, validation paiement) dans une table d'audit.
