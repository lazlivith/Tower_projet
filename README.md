# TowerWeb — Plateforme multisite (Vitrine + E‑Learning LMS)

Monorepo : **`backend/`** (API Express 5 + Prisma 7 + PostgreSQL) · **`frontend/`** (Vite + React 18 + React Router 7 + Tailwind).

## Développement local

### Prérequis
- Node.js 20+
- PostgreSQL 14+ (ou `docker compose up db`)

### Backend
```bash
cd backend
cp .env.example .env          # renseigner DATABASE_URL, JWT_SECRET, …
npm install
npx prisma migrate dev        # crée le schéma
npm run seed                  # comptes de démo (admin/prof/eleve @tower.ma — password123)
npm run dev                   # http://localhost:5000  (Swagger : /api/docs)
```

### Frontend
```bash
cd frontend
cp .env.example .env          # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                   # http://localhost:5173
```

### Tout en Docker
```bash
docker compose up --build
docker compose exec api npm run seed
# front : http://localhost:8080   ·   api : http://localhost:5000
```

## Tests & qualité
```bash
cd backend  && npm test          # Vitest + Supertest
cd frontend && npm run typecheck && npm run build
```
La CI GitHub Actions (`.github/workflows/ci.yml`) exécute ces étapes sur chaque push/PR
et applique `prisma migrate deploy` sur `main` (secret `DATABASE_URL`).

## Déploiement

| Composant | Cible | Fichier |
|---|---|---|
| Base de données | Render / Supabase / Neon (PostgreSQL managé) | `render.yaml` |
| API | Render / Railway / VPS Docker | `render.yaml`, `backend/Dockerfile` |
| Front (vitrine + LMS) | Vercel / Netlify / statique | `frontend/vercel.json`, `frontend/netlify.toml`, `frontend/Dockerfile` |

**Variables à définir en production** — voir `backend/.env.example` et `frontend/.env.example`.
Points d'attention :
- `FRONTEND_URL` (API) doit contenir l'origine exacte du front (CORS) — plusieurs origines séparées par des virgules.
- `VITE_API_URL` (front) est figée **au build**.
- Webhook Stripe : pointer vers `POST /api/payments/webhook` et renseigner `STRIPE_WEBHOOK_SECRET`.
- `start:prod` applique les migrations Prisma avant de démarrer l'API.
- Sécurité : voir `backend/docs/SECURITY.md` (dont la mitigation `xlsx` via CDN SheetJS).

## Cahier des charges
Suivi d'avancement W1→W8 et audit des endpoints : `backend/docs/API_ENDPOINTS.md`.
