# -------------------------------------------------------------
# Dockerfile Multi-Stage untuk Next.js + Prisma ORM
# -------------------------------------------------------------

FROM node:20-alpine AS base

# 1. Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

# 2. Rebuild source code
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# 3. Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next

# Buat direktori data untuk persistensi lokal jika diperlukan
RUN mkdir -p /app/data /app/public/data /app/public/uploads && chown -R nextjs:nodejs /app/data /app/public

USER nextjs

EXPOSE 3000

CMD ["npx", "next", "start"]
