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

## Correctifs appliqués (post-W7)

| Paquet | Correctif | Détail |
|---|---|---|
| `xlsx` (SheetJS) | `0.18.5` (npm, vulnérable) → `0.20.3` via le CDN officiel SheetJS | Plus de correctif publié sur le registre npm pour ce paquet ; mitigation officielle du mainteneur : `npm i https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` (URL versionnée, pas `xlsx-latest`, pour un lockfile reproductible). |
| `multer` | `2.2.0` → `2.4.0` | Corrige plusieurs DoS (noms de champs forgés, fuite de descripteurs de fichiers, bypass de limite de taille). Reste dans la plage déjà déclarée, aucun changement de code. |
| `proxy-addr` (transitif, via `express`) | `2.0.7` → `2.0.8` | Corrige l'usurpation d'IP via IPv4 mappée en IPv6 — pertinent car `trust proxy` est activé pour le rate-limiting. |
| `nodemailer` | `9.0.1` → `10.1.2` | Corrige un cache DNS global qui réutilisait le `servername` TLS entre transports (fuite d'identifiants SMTP inter-locataires). Montée de version majeure : aucune rupture pour notre usage (`createTransport({host,port,auth})` + `sendMail({from,to,subject,html})`), Node 20+ déjà requis. |

## Vulnérabilités résiduelles connues (npm audit)

| Paquet | Sévérité | Statut |
|---|---|---|
| `deepmerge-ts`, `mysql2`, `qs`, `fast-uri`, `ip-address`, `brace-expansion`, `@prisma/config`… | moderate/high | Transitifs via `prisma` CLI (**devDependency**, isolés dans l'étape `deps`/le service `migrator` du build Docker — jamais présents dans l'image `api` servie en production). Pas d'entrée utilisateur. |

## À renforcer ultérieurement

- Verrouillage progressif / captcha après N échecs de login par compte (au-delà du rate-limit IP).
- Rotation de `JWT_SECRET` + `kid`.
- Journalisation des accès sensibles (onboarding, validation paiement) dans une table d'audit.
