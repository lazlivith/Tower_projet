# ---- TowerWeb API ----
FROM node:20-alpine AS base
WORKDIR /app

# OpenSSL + wget requis par Prisma (moteur de requêtes) et par le HEALTHCHECK, sur Alpine
RUN apk add --no-cache openssl wget

# Dépendances (le postinstall lance `prisma generate` → le schéma doit être présent)
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --omit=dev

# Code applicatif
COPY src ./src

ENV NODE_ENV=production
EXPOSE 5000

# Exécution en utilisateur non privilégié (image officielle Node : uid/gid 1000)
RUN chown -R node:node /app
USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5000/api/health || exit 1

# Applique les migrations en attente puis démarre l'API
CMD ["npm", "run", "start:prod"]
