# ---- TowerWeb API ----
FROM node:20-alpine AS base
WORKDIR /app

# OpenSSL requis par Prisma sur Alpine
RUN apk add --no-cache openssl

# Dépendances (le postinstall lance `prisma generate` → le schéma doit être présent)
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --omit=dev

# Code applicatif
COPY src ./src

ENV NODE_ENV=production
EXPOSE 5000

# Applique les migrations en attente puis démarre l'API
CMD ["npm", "run", "start:prod"]
