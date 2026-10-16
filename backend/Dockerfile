# ---- TowerWeb API ----
#
# Deux étapes :
#  - `deps`    : toutes les dépendances (CLI prisma inclus) + client généré.
#                Sert aussi de base au service `migrator` de docker-compose.yml
#                (build --target deps, exécute `prisma migrate deploy`).
#  - `runtime` : seulement les dépendances de production. Le CLI prisma
#                (~200 Mo avec Prisma Studio et ses dépendances) n'est jamais
#                embarqué ici — il vit en devDependencies.

# ---- Étape 1 : dépendances + génération du client Prisma ----
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci
RUN npx prisma generate

# ---- Étape 2 : image d'exécution (sans le CLI prisma) ----
FROM node:20-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache openssl wget
ENV NODE_ENV=production

COPY package*.json ./
# --omit=optional : `@prisma/client` déclare `prisma` en peerDependency *optionnelle*,
# ce qui le fait réinstaller malgré --omit=dev si on ne l'exclut pas explicitement.
# --ignore-scripts : le postinstall (`prisma generate`) a besoin du CLI, volontairement
# absent ici — le client déjà généré est repris tel quel depuis l'étape `deps`.
RUN npm ci --omit=dev --omit=optional --ignore-scripts
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules/@prisma/client ./node_modules/@prisma/client

COPY src ./src
# Scripts de seed (`npm run seed`, etc.) — n'ont besoin que de @prisma/client,
# jamais du CLI. Dossier minuscule (~100 Ko), inclus tel quel.
COPY prisma ./prisma

# Exécution en utilisateur non privilégié (image officielle Node : uid/gid 1000).
# `chown -R` sur node_modules doublerait la taille de l'image (OverlayFS réécrit
# chaque fichier dans une nouvelle couche) : on se contente de donner à `node`
# le droit d'écrire dans /app (utile pour `uploads/`, fallback disque local),
# le reste (node_modules, src) reste root:root mais lisible par tous — suffisant
# pour un processus qui ne fait que lire son code et ses dépendances.
RUN chown node:node /app
USER node

EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5000/api/health || exit 1

# Les migrations sont appliquées par le service `migrator` (docker-compose.yml)
# avant que ce conteneur ne démarre — ici on ne fait que lancer l'API.
CMD ["node", "src/index.js"]
